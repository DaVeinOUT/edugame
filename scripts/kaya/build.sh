#!/bin/sh
set -eu
TASK_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
TASK_BLENDER=${BLENDER_PATH:-blender}
# Export the current edited source. Never regenerate v1 or overwrite a .blend.
if [ "$#" -gt 1 ]; then
  echo 'Usage: sh scripts/kaya/build.sh [output.glb]' >&2
  exit 2
fi
TASK_OUTPUT=${1:-"$TASK_ROOT/assets/kaya/kaya-production-v2.glb"}
"$TASK_BLENDER" --background --python "$TASK_ROOT/scripts/kaya/export_blend.py" -- --source "$TASK_ROOT/docs/design/kaya-compagnon/production/v2/kaya-production-v2.blend" --output "$TASK_OUTPUT"
python3 "$TASK_ROOT/scripts/kaya/validate_glb.py" "$TASK_OUTPUT"
