Asana Personal Stats
============

This project demonstrates a possible use of the Asana API. It accepts a user's API key and generates various usage graphs for a specific workspace. It is designed to keep track of user productivity trends over time. The original version keeps tracks completed tasks, open tasks, and total followers on a daily basis. Potential future metrics include:

*    Subtasks completed 
*    Average time to complete tasks;
*    Average time to complete subtasks;
*    Percentage of completed tasks vs open tasks;
*    Distinct followers;
*    Number of projects user belongs to
*    Numer of days early / late user completed from due date

To run:
`node index.html`

Then point your browser at:
http://localhost:8888/

Be careful! This application queries all tasks in a workspace. If there are
over 100 you will exceed the API limit. As of now there are no error checks so
this is bad. Before adding metrics, it would be wise to refactor and make it
more robust.
