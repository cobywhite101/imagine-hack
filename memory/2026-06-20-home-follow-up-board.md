# Home follow-up board

## Symptom

The Home todo board rendered To Do, In progress, and Done lanes, but did not include a Follow-up lane even though the Home summary and metrics referenced follow-ups due today.

## Root cause

`src/pages/Home.jsx` used a static `boardGroups` status list with no `Follow-up` status. Because `TodoList` renders lanes only from `boardGroups`, any follow-up tasks had no first-class board lane.

## Fix

Added a `Follow-up` board group, seeded two follow-up cards, added `Follow-up` to the task modal status selector, and adjusted the todo board width wrappers to support four lanes.

## Evidence

- `npm run build` passed.
- GStack `/browse` verified `data-testid="home-todo-list"` contains `Follow-up` with count `2` and the two follow-up cards.
- After reload, GStack `/browse` reported no console errors.

## Status

DONE
