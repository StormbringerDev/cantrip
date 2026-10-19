[arg("target", pattern="ts|c")]
generate-ast target outdir:
    python tools/generate_ast.py --target={{target}} {{outdir}}

build-ts:
    cd ts && pnpm install && pnpm build

run-ts path="":
    cd ts && pnpm dev {{path}}

build-c:
    cd c && cmake --preset dev && cmake --build --preset dev

run-c path="": build-c
    ./c/build/dev/cantrip {{path}}

test-ts: build-ts
    cd ts && pnpm test

test-c: build-c
    ctest --preset dev

conformance-ts:
    python tools/conformance.py --cmd "python -m cantrip"

conformance-c: build-c
    python tools/conformance.py --cmd "./c/build/dev/cantrip"

test-all: test-ts test-c conformance-ts conformance-c

clean:
    rm -rf c/{.cache,build} ts/{coverage,dist,node_modules}