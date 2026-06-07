import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class OomPracticeApp {
    private static final List<byte[]> RETAINED_BLOCKS = new ArrayList<>();
    private static final List<String> RETAINED_STRINGS = new ArrayList<>();

    public static void main(String[] args) throws Exception {
        System.out.println("OOM practice app started at " + LocalTime.now());
        System.out.println("PID=" + ProcessHandle.current().pid());
        System.out.println("This app intentionally leaks heap memory.");

        long cycle = 0;
        try {
            while (true) {
                cycle++;

                for (int i = 0; i < 8; i++) {
                    RETAINED_BLOCKS.add(new byte[1024 * 1024]);
                }

                for (int i = 0; i < 400; i++) {
                    RETAINED_STRINGS.add(UUID.randomUUID() + "-payload-" + cycle + "-" + i);
                }

                if (cycle % 5 == 0) {
                    long usedMb = usedMemoryMb();
                    System.out.println(
                        LocalTime.now()
                            + " cycle=" + cycle
                            + " usedMemoryMB=" + usedMb
                            + " retainedBlocks=" + RETAINED_BLOCKS.size()
                            + " retainedStrings=" + RETAINED_STRINGS.size()
                    );
                }

                Thread.sleep(150);
            }
        } catch (OutOfMemoryError oom) {
            System.err.println("OOM reached at " + LocalTime.now() + ": " + oom);
            throw oom;
        }
    }

    private static long usedMemoryMb() {
        Runtime runtime = Runtime.getRuntime();
        return (runtime.totalMemory() - runtime.freeMemory()) / 1024 / 1024;
    }
}
