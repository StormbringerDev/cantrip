#ifndef CANTRIP_LOCATION_H
#define CANTRIP_LOCATION_H

#include "common.h"

typedef struct {
  int line;
  int column;
  int offset;
} Position;

typedef struct {
  Position start;
  Position end;
} Span;

#endif