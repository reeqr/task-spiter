import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.UUID;

public class JfrPracticeApp {
    private static final Object LOCK = new Object();
    private static final List<byte[]> LEAKY_CACHE = new ArrayList<>();
    private static final List<Map<String, String>> LONG_LIVED_METADATA = new ArrayList<>();
    private static final Random RANDOM = new Random();

    public static void main(String[] args) throws Exception {
        System.out.println("JFR practice app started at " + LocalTime.now());
        System.out.println("PID=" + ProcessHandle.current().pid());
        System.out.println("This app creates CPU load, lock contention, allocations, thread churn, and file I/O.");

        startThread("cpu-burner", JfrPracticeApp::cpuBurner);
        startThread("allocator", JfrPracticeApp::allocator);
        startThread("burst-allocator", JfrPracticeApp::burstAllocator);
        startThread("retained-metadata", JfrPracticeApp::retainedMetadataBuilder);
        startThread("lock-holder", JfrPracticeApp::lockHolder);
        startThread("lock-waiter", JfrPracticeApp::lockWaiter);
        startThread("file-io", JfrPracticeApp::fileIoLoop);
        startThread("thread-churn", JfrPracticeApp::threadChurn);

        while (true) {
            Thread.sleep(5000);
            long usedMb = (Runtime.getRuntime().totalMemory() - Runtime.getRuntime().freeMemory()) / 1024 / 1024;
            System.out.println(
                LocalTime.now()
                    + " heartbeat: usedMemoryMB=" + usedMb
                    + ", cacheChunks=" + LEAKY_CACHE.size()
                    + ", metadataObjects=" + LONG_LIVED_METADATA.size()
                    + ", liveThreads=" + Thread.activeCount()
            );
        }
    }

    private static void startThread(String name, Runnable action) {
        Thread thread = new Thread(action, name);
        thread.setDaemon(true);
        thread.start();
    }

    private static void cpuBurner() {
        long n = 10_000_019L;
        while (true) {
            isPrime(n++);
            if (n % 50_000 == 0) {
                sleep(50);
            }
        }
    }

    private static void allocator() {
        while (true) {
            for (int i = 0; i < 20; i++) {
                byte[] block = new byte[512 * 1024];
                block[0] = (byte) RANDOM.nextInt(256);
                if (RANDOM.nextInt(10) == 0) {
                    LEAKY_CACHE.add(block);
                    if (LEAKY_CACHE.size() > 40) {
                        LEAKY_CACHE.subList(0, 10).clear();
                    }
                }
            }
            sleep(200);
        }
    }

    private static void burstAllocator() {
        while (true) {
            List<String> transientPayloads = new ArrayList<>();
            for (int i = 0; i < 2_000; i++) {
                transientPayloads.add(UUID.randomUUID() + "-payload-" + RANDOM.nextInt(10_000));
            }
            transientPayloads.sort(String::compareTo);
            sleep(80);
        }
    }

    private static void retainedMetadataBuilder() {
        while (true) {
            Map<String, String> metadata = new HashMap<>();
            for (int i = 0; i < 100; i++) {
                metadata.put("key-" + i, UUID.randomUUID() + "-value-" + RANDOM.nextInt(100_000));
            }
            LONG_LIVED_METADATA.add(metadata);
            if (LONG_LIVED_METADATA.size() > 120) {
                LONG_LIVED_METADATA.subList(0, 20).clear();
            }
            sleep(120);
        }
    }

    private static void lockHolder() {
        while (true) {
            synchronized (LOCK) {
                busyWork(120);
            }
            sleep(30);
        }
    }

    private static void lockWaiter() {
        while (true) {
            synchronized (LOCK) {
                busyWork(15);
            }
            sleep(10);
        }
    }

    private static void fileIoLoop() {
        Path path = Path.of(System.getProperty("java.io.tmpdir"), "jfr-practice.log");
        while (true) {
            try {
                String payload = LocalTime.now() + " sample=" + RANDOM.nextInt() + System.lineSeparator();
                Files.writeString(path, payload, StandardCharsets.UTF_8);
                Files.readString(path, StandardCharsets.UTF_8);
            } catch (IOException e) {
                System.err.println("file-io error: " + e.getMessage());
            }
            sleep(150);
        }
    }

    private static void threadChurn() {
        while (true) {
            List<Thread> burst = new ArrayList<>();
            for (int i = 0; i < 12; i++) {
                Thread thread = new Thread(() -> {
                    List<byte[]> scratch = new ArrayList<>();
                    for (int round = 0; round < 15; round++) {
                        scratch.add(new byte[64 * 1024]);
                        if (scratch.size() > 4) {
                            scratch.remove(0);
                        }
                        busyWork(8);
                    }
                }, "burst-worker-" + System.nanoTime() + "-" + i);
                burst.add(thread);
                thread.start();
            }
            for (Thread thread : burst) {
                try {
                    thread.join();
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    return;
                }
            }
            sleep(250);
        }
    }

    private static boolean isPrime(long value) {
        if (value < 2) {
            return false;
        }
        for (long i = 2; i * i <= value; i++) {
            if (value % i == 0) {
                return false;
            }
        }
        return true;
    }

    private static void busyWork(long millis) {
        long end = System.nanoTime() + millis * 1_000_000L;
        long x = 0;
        while (System.nanoTime() < end) {
            x += RANDOM.nextInt(100);
        }
        if (x == 42) {
            System.out.println("never happens");
        }
    }

    private static void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
