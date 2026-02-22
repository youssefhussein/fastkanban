i wanna build a fancy kanban board web app, i have set it up with nextjs, convex, tailwind and shadcn ui.
Whenever big changes are made make sure the types are correct with "pnpm run lint". NEVER use an "any" or "unknown" type
My main requirements are:
- user can have many projects , each project has its own kanban board
- by default the kanban board will have 4 columns : Backlog, TODO, In-Progress, Done
- The "Backlog" and "Done" column are mandatory and cannot be deleted but the user can add and remove other columns
- every day 24h (also could be toggled by a button) the board auto cleans itself : all cards in the Done column get deleted, and the rest of the cards in the other columns get moved back into the Backlog column

Kanban cards have a title and description
