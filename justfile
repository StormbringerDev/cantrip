[arg("target", pattern="python|py|c")]
generate-ast target:
    python tools/generate_ast.py {{target}}

run-python path="":
    cd python && uv run cantrip {{path}}

build-c:
    cd c && cmake --preset dev && cmake --build --preset dev

run-c path="": build-c
    ./c/build/dev/cantrip {{path}}

test-python:
    cd python && uv run pytest

test-c: build-c
    ctest --preset dev

conformance-python:
    python tools/conformance.py --cmd "python -m cantrip"

conformance-c: build-c
    python tools/conformance.py --cmd "./c/build/dev/cantrip"

test-all: test-python test-c conformance-python conformance-c

clean:
    rm -rf c/{.cache,build} python/src/**/__pycache__ .pytest_cache **/.pytest_cache