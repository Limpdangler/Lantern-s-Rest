#!/bin/sh
# Runs the quick automated checks. Each prints PASS/FAIL or a list of errors.
cd "$(dirname "$0")/.." && python3 build.py && node --check dist/check.js && echo "build OK"
for t in save_test seed_test effects_test explore_rules_test social_test interact_test text_test feat3 feat5 feat6; do echo "== $t"; python3 tests/$t.py 2>&1 | grep -E "PASS|FAIL|ERR|errors"; done
