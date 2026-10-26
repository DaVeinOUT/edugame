#!/bin/sh
set -eu
TASK_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
TASK_BLENDER=${BLENDER_PATH:-blender}
"$TASK_BLENDER" --background --factory-startup --python "$TASK_ROOT/scripts/kaya/build_model.py" -- --root "$TASK_ROOT" "$@"
python3 "$TASK_ROOT/scripts/kaya/validate_glb.py" "$TASK_ROOT/assets/kaya/kaya-production-v1.glb"
