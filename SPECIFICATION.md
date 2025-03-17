## 1. System Overview

This system manages the inventory of materials such as tablets, pharmaceuticals, ampoules, as well as intermediate and final products, including processes for receiving, issuing, and re-receiving (returns). It provides various functionalities such as master data and inventory data management, label printing, integration with weighing scales, and CSV import/export. The goal is to enable users to efficiently track and manage inventory.

## 2. Main Functions

### Master Data Management

* Managed items: Suppliers, manufacturers, materials, statuses, containers, categories
* Statuses include: "In Storage," "Issued (Under Testing)," "Used (Possibly Unnecessary)," "Re-Received," "Pending Judgment," "Awaiting Disposal," "Disposed"

### Inventory Data Display

* Display items: ID, product name, lot number, status, expiration date, storage period, registration date, update date, creator, notes, current weight, net weight, container weight, receiving weight, etc.

### Receiving Process (Registration)

* Select material from the master, enter lot number, purpose, expiration date, storage period, quantity (including package size), storage location, and custom fields (described later).
* Weighing is performed in integration with the scale.
* Upon pressing the "Receive" button, labels are printed.
* After affixing the label, re-weighing is conducted to record the accurate weight.

### Issuance Reservation Function

* Input details: material, lot number, purpose, required quantity (entire quantity option available), issuance date, return date (default is same day; if different, a note is required), test name (custom field), and notes.
* If reservation data exists, it is reflected in the issuance reservation screen; if no reservation exists, direct issuance is possible (if enabled).

### Issuance Process

* If reservation data exists, it is automatically reflected; otherwise, manual input is required.
* Barcode scanning and weighing are performed. If the weight difference exceeds the set tolerance (%), an alert is triggered.
* Upon pressing the "Issue" button, the status changes to "Issued" and is recorded in the issuance history.

### Re-receiving (Acceptance) Process

* Scan the barcode of the returned specimen.
* Perform weighing again to check the difference from the issued quantity.
* Press the "Re-Receive" button to update the status to "Re-Received" and reflect the remaining amount.

### CSV Import/Export Function

* Future enhancement: batch CSV import for receiving data and CSV export for inventory data to enable external integration, backup, and analysis.

### Stocktaking Function

* Provides the ability to verify consistency with actual inventory during periodic stocktaking.

### Weighing Scale Integration

* Real-time data acquisition and error checking during receiving, issuing, and re-receiving.
* The allowable weighing error is evaluated based on the tolerance percentage set in the material master.

### Custom Field Function

* Allows text, selection, and date fields to be entered alongside fixed fields during inventory registration, issuance reservation, and issuance.

## 3. Detailed Process Flow

### 3.1 Receiving Process (Registration) Flow

* **Initial Input:**
    * Select material from the master, enter lot number, purpose, expiration date, storage period, quantity, storage location, and custom fields (e.g., notes, additional information).
    * The system generates an ID automatically.
* **Weighing:**
    * Perform weighing, including the container weight (including label weight).
* **Label Printing:**
    * Labels are printed when the "Receive" button is pressed (batch printing supported if needed).
* **Affixing and Re-weighing:**
    * After affixing labels, re-weigh all specimens and record the final weight.

### 3.2 Issuance Reservation Flow

* **Reservation Input:**
    * Input material, lot number, purpose, required quantity, issuance date, return date, test name (custom field), and notes.
    * If reservation data exists, it can be operated via the dedicated tab in the issuance screen.
* **ID Scanning & Weighing:**
    * Scan the barcode of the target specimen and perform weighing to check measurement error.
* **Reservation Registration:**
    * Register the data as an issuance reservation.

### 3.3 Issuance Process Flow

* **Reservation or Direct Selection:**
    * If a reservation exists, the data is automatically reflected; otherwise, direct issuance is possible (if enabled).
* **Automatic Reflection:**
    * The final issuance quantity is managed in weight units.
* **ID Scanning & Weighing:**
    * Scan the barcode and weigh. If the weight deviation exceeds the tolerance, an alert is displayed.
* **Completion:**
    * Pressing the "Issue" button updates the status to "Issued" and records the issuance history.

### 3.4 Re-receiving Process (Acceptance) Flow

* **Barcode Scanning:**
    * Scan the barcode of the returned specimen.
* **Weighing:**
    * If there is a significant weight difference from issuance, an alert is displayed.
* **Completion:**
    * Pressing the "Re-Receive" button updates the status to "Re-Received" and automatically reflects the remaining amount.

## 4. System Requirements & Development Environment

### 4.1 Functional Requirements

* CRUD operations for various master data
* Implementation of receiving, issuing, re-receiving, and subdivision processes
* Data extraction/filtering from issuance reservations
* CSV import/export function
* Real-time integration with weighing scales and error checking
* Alert notifications (unreturned items, expiration dates, weighing errors)
* Stocktaking function

### 4.2 Non-functional Requirements

* **Performance:** Fast searching and displaying of large data sets (utilizing SQL optimizations such as partial indexing, CTE, and parallel queries).
* **Reliability:** Accurate management of measured values and transaction history.
* **Scalability:** Flexible handling of additional custom fields and changes to inventory processes.
* **Usability:** Intuitive UI, barcode scanning, label printing integration.
* **Security:** User role management and operation logging.

### 4.3 Development Environment & Technologies

* **Frontend:** React (TypeScript)
* **Backend:** Node.js (TypeScript)
* **Database:** PostgreSQL
* **ORM:** Prisma
* **Floating Point Precision:** Uses decimal.js for precision up to 0.001g

## 5. Technical Considerations

* **Weighing Error Settings:** Set in material master as a percentage, applied consistently across issuance and re-receiving.
* **Floating Point Calculations:** Uses decimal.js to maintain precision at 0.001g.
* **Inventory Count Management:** Uses SQL aggregations optimized with indexing, CTE, and parallel queries.
* **Container Weight Management:** Maintains historical data when container specifications change.
* **Tablet Management:** Records unit weight and count during registration, generating child inventory when converted to powder.
* **Subdivision Process:** Manages parent-child relationships in inventory data. Parent inventory is marked as "Used," and child inventory is newly created.

## 6. Technical Considerations

* **Setting Weighing Errors:**
    * Tolerance is set in % units in the material master. The same setting is applied for both outgoing and re-warehousing.
* **Floating-Point Calculations:**
    * Ensure precision to 0.001g units in front-end calculations using libraries like decimal.js.
* **Inventory Quantity Management:**
    * Inventory quantity is calculated on demand using SQL aggregation functions (optimized with partial indexes, CTEs, Parallel Query, etc.).
* **Container Weight Management:**
    * Maintain historical data and reflect the latest weight information even when container specifications change for the same material.
* **Tablet Management:**
    * For tablet categories, record "number of tablets" and "weight per tablet" at registration, create child inventory data upon powder conversion, and change parent inventory to "used".
* **Custom Items:**
    * Allow mixed input of text, selection, and date items during inventory registration, outgoing reservation, and outgoing.
* **Reduction Processing:**
    * Adopt a data structure that maintains parent-child relationships during subdivision processing. Parent inventory is automatically "used", and subsequent management is performed with child inventory.

## 7. Coordination/Interfaces

### 7.1 Weighing Scale Coordination:

* Consider data acquisition methods from weighing scales (wired/wireless, API integration, etc.).
* Measurement error thresholds refer to the material master settings (%).

### 7.2 CSV Import/Export:

* **CSV Import:**
    * Assume bulk import of incoming data. Define CSV format specifications (required items, optional items, error check rules, etc.).
* **CSV Export:**
    * Implement inventory data output function for coordination with external systems and backup purposes.

## 8. User Interface (UI) Image

* **Dashboard:**
    * Display inventory status, outgoing reservation list, and alert notifications (expiration date, unreturned, weighing error).
* **Master Management Screen:**
    * CRUD operations for suppliers, manufacturers, materials, containers, etc.
* **Inventory Management Screen:**
    * Equipped with inventory list, detailed display, search/filtering functions, and CSV export functions.
* **Incoming/Outgoing Operation Screen:**
    * Dedicated screens for each process of incoming, outgoing reservation, outgoing, re-warehousing, and direct outgoing.
* **Label Printing Screen:**
    * Label printing settings and preview functions at incoming.

## 9. Answers to Questions/Confirmation Items and Specification Reflection

* **Unit Specification at Outgoing:**
    * Manage everything in weight units.
    * For tablet categories, record "number of tablets" and "weight per tablet" at registration. When converting to powder, create child inventory data and update parent data to "used" (current weight is zero).
    * Other management methods include a mechanism to convert internally to weight after input in units of tablets or tablets, but it is judged that it is appropriate to unify in weight units in consideration of consistency of the whole system.
* **Outgoing Reservation and Direct Outgoing Operation:**
    * If there is no outgoing reservation, direct outgoing is performed by tab switching in the outgoing screen.
    * If reservation data exists, reservation information is automatically reflected, and items are corrected as necessary.
* **Weighing Error Threshold Setting:**
    * Tolerance is set in % units in the material master. The same setting is used for outgoing and re-warehousing.
* **JS Floating Point Precision Measures:**
    * Ensure calculation precision with 0.001g weighing units and using decimal.js, etc.
* **Inventory Quantity Data Management Method:**
    * Adopt a method to calculate the inventory quantity by SQL aggregation. Implement optimization such as partial index, CTE, Parallel Query.
* **Specific Content of Custom Items:**
    * Allow mixed input of text, selection, and date items in inventory master and outgoing reservation/outgoing.
    * Manage fixed items and dynamic items in an integrated manner.
* **Details of Reduction Processing:**
    * When subdivision (reduction) processing, parent inventory data is automatically updated to "used" as management of parent-child relationship, and child inventory data is newly created. However, we would like to consider the possibility of linking with parent data as an option.
    * Detailed data structures and coordination rules adopt specifications tailored to the operation of this system.
