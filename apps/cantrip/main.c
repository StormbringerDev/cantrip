#include <stdio.h>
#include <stdlib.h>

int main(int argc, char *argv[]) {
  if (argc == 1) {
    printf("The REPL for %s has not yet been implemented in C.\n", argv[0]);
    printf("To run the REPL, run 'pnpm run repl' in the terminal.\n");
    exit(1);
  } else if (argc == 2) {
    printf("The %s bytecode VM has not yet been implemented.\n", argv[0]);
    printf("To run the REPL, run 'pnpm run repl' in the terminal.\n");
    exit(1);
  } else {
    printf("Usage: %s [FILE]\n", argv[0]);
    exit(1);
  }
  return 0;
}