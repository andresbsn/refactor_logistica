# Crew Ticket Resolution Skill

## Context
This skill defines the business logic and database events that must occur when a crew (cuadrilla) interacts with a ticket during a route.

## Resolution Workflow

### 1. Photo "Before" (Antes)
When the crew uploads the initial photo of the issue:
- **Frontend**: Call `uploadService.uploadImage(file, "images/reclamos/{nroticket}/antes.jpg")` which returns `{ url: "https://s3.muni-sn.com.ar/images/reclamos/{nroticket}/antes.jpg" }`
- **Database - `log_route_location`**:
    - Register a new event.
    - `numero_ruta`: The current route number.
    - `ticket_id`: ID of the ticket being resolved.
    - `numero_evento`: `2`.
    - `timestamp`: Current date/time.
- **Database - `log_route_ticket`**:
    - Update the ticket status for this route.
    - `inprocess`: `true`.
- **External**: Send notification with photo via `externalService.sendTicketNote()`

### 2. Photo "After" (Después)
When the crew uploads the final photo after the task is completed:
- **Frontend**: Call `uploadService.uploadImage(file, "images/reclamos/{nroticket}/despues.jpg")` which returns `{ url: "https://s3.muni-sn.com.ar/images/reclamos/{nroticket}/despues.jpg" }`
- **Database - `log_route_location`**:
    - Register a new event.
    - `numero_ruta`: The current route number.
    - `ticket_id`: ID of the ticket being resolved.
    - `numero_evento`: `3`.
    - `timestamp`: Current date/time.

### 3. Final Resolution (Cerrar Ticket)
When the crew submits the resolution form (Finalizar Reparación):
- **Database - `log_route_ticket`**:
    - `is_closed`: `true`.
    - `inprocess`: `false`.
    - `updated_at`: Current timestamp.
- **External**: Send final notification with `[TRABAJO TERMINADO]` note and after image.

## Session Recovery (Resume In-Progress Tickets)

When a crew member opens the ticket resolution dialog for a ticket that has `inprocess: true`:

### Backend
- **Endpoint**: `GET /api/routes/:routeId/tickets/:ticketId/status`
- **Response**: `{ inprocess: boolean, is_closed: boolean, ... }`

### Frontend
1. On dialog open, call `routeService.getTicketStatus(routeId, ticketId)`
2. If `inprocess === true`:
   - Load existing before image from S3: `https://s3.muni-sn.com.ar/images/reclamos/{nroticket}/antes.jpg`
   - Display it in the "Antes" photo field
   - The `beforeImageUrl` is set so validation passes
3. Crew can proceed directly to upload "Después" photo and complete the ticket

### S3 Storage
- **Bucket**: `https://s3.muni-sn.com.ar`
- **Path**: 
  - Photo "Before": `images/reclamos/{nroticket}/antes.jpg`
  - Photo "After": `images/reclamos/{nroticket}/despues.jpg`
- The frontend specifies the path when calling `uploadService.uploadImage(file, path)`

## Implementation Guidelines
- Front-end: Trigger incremental updates to the backend as photos are uploaded, rather than waiting for the final submit, to ensure event logging is accurate in time.
- Back-end: Provide endpoints or update existing ones to handle these specific status changes and logging events.

### Session Recovery Flow
1. Crew starts resolving a ticket, uploads "Antes" photo
2. `inprocess` is set to `true` in `log_route_ticket`
3. For any reason (app crash, navigation away, etc.), the crew reopens the ticket
4. The dialog detects `inprocess === true` and automatically loads the existing before image from S3
5. Crew proceeds to upload "Después" photo and complete resolution
