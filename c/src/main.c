#include "common.h"
#include "lexer.h"
#include "token.h"

#include <stdio.h>
#include <stdlib.h>

// Placeholder function until bytecode VM is implemented
static bool interpret(const char *source) {
  Lexer lexer;
  init_lexer(&lexer, source);

  int line = -1;
  bool had_error = false;
  while (true) {
    Token token = scan_token(&lexer);
    if (token.span.start.line != line) {
      printf("%4d ", token.span.start.line);
      line = token.span.start.line;
    } else {
      printf("   | ");
    }
    printf(": %4d ", token.span.start.column);
    printf("%2d '%.*s'\n", token.type, token.length, token.start);

    if (token.type == TOKEN_ERROR)
      had_error = true;

    if (token.type == TOKEN_EOF)
      break;
  }

  return !had_error;
}

static void repl(void) {
  printf("Welcome to Cantrip v%s.\n", CANTRIP_VERSION);
  printf("Press Ctrl+D to exit the REPL.\n");

  char line[1024];
  while (true) {
    printf("> ");

    if (!fgets(line, sizeof(line), stdin)) {
      printf("\n");
      break;
    }

    interpret(line);
  }
}

static char *read_file(const char *path) {
  FILE *file = fopen(path, "rb");
  if (file == NULL) {
    fprintf(stderr, "Could not open file \"%s\".\n", path);
    exit(1);
  }

  fseek(file, 0L, SEEK_END);
  size_t file_size = ftell(file);
  rewind(file);

  char *buffer = (char *)malloc(file_size + 1);
  if (buffer == NULL) {
    fprintf(stderr, "Not enough memory to read \"%s\".\n", path);
    exit(1);
  }

  size_t bytes_read = fread(buffer, sizeof(char), file_size, file);
  if (bytes_read < file_size) {
    fprintf(stderr, "Could not read file \"%s\".\n", path);
    exit(1);
  }

  buffer[bytes_read] = '\0';

  fclose(file);
  return buffer;
}

static void run_file(const char *path) {
  char *source = read_file(path);
  bool result = interpret(source);
  free(source);

  if (!result)
    exit(1);
}

int main(int argc, char *argv[]) {
  if (argc == 1) {
    repl();
  } else if (argc == 2) {
    run_file(argv[1]);
  } else {
    fprintf(stderr, "Usage: cantrip [path]\n");
    exit(1);
  }

  return 0;
}
