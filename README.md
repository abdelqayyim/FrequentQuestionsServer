# FrequentQuestions Server

## **What Is It?**

The FrequentQuestions Server is a Node.js server designed to manage and serve data related to user notes and language courses. The server utilizes `Express` for routing and `MongoDB` with `Mongoose` for database operations.

## **Routes**

### **1. GET /**

**Description:**  
Returns the list of available languages or courses.


**Response:**

- **200 OK:** Returns an array of languages or courses.
- **500 Internal Server Error:** If there is an issue retrieving the data.

### **2. GET /getLanguage**

**Description:**  
Get the specific language. Return language, its ID and all notes.

**Body Format:**

```json
{
  "language_id": "String"
}
```

### **3. GET /getNotes**

**Description:**  
Returns the list of notes for the specified language.

**Body Format:**

```json
{
  "language_id": "String"
}
```
**Response:**

- **200 OK:** Returns an array of notes for the specified language.
- **404 Bad Request:** When the language does not exist.
- **500 Internal Server Error:** If there is an issue retrieving the notes.

### **4. POST /:languageName**

**Description:**  
Creates a new Langueg in the Database.

**Parameters:**

- `languageName` (URL parameter): The name of the language.

**Response:**

- **201 OK:** Successfully created language in database and returns the new language.
- **400 Bad Request:** When the language already exists.
- **500 Internal Server Error:** If there is an issue creating the new language.

### **5. GET /getNote/:note_id**

**Description:**  
Returns a specific note from a language/course.

**Parameters:**

- `note_id` (URL parameter): The id of the note detail to be fetched.

**Body Format:**

```json
{
  "language_id": "String"
}
```

**Response:**

- **200 OK:** Successfully found and retrieved the language and note detail.
- **404 Bad Request:** When the language or note is not found.
- **500 Internal Server Error:** If there is an issue fetching the note.

### **6. POST /notes/newNote**

**Description:**  
Creating a new note.

**Body Format:**

```json
{
  "language_id": "String",
  "title": "String",
  "description": "String",
  "note_detail": "String"
}
```
**Response:**

- **201 OK:** Successfully found and retrieved the language and note detail.
- **400 Bad Request:** Missing required fields in the body.
- **404 Bad Request:** Language is not found.
- **500 Internal Server Error:** If there is an issue fetching the note.


### **7. PUT /notes/updateNote**

**Description:**  
Updating a note.

**Body Format:**

```json
{
  "language_id": "String",
  "title": "String",
  "description": "String",
  "note_detail": "String"
}
```
**Response:**

- **200 OK:** Successfully updated note.
- **400 Bad Request:** Missing required fields in the body.
- **404 Bad Request:** Language or note is not found.
- **500 Internal Server Error:** If there is an issue fetching the note.

### **8. DELETE /deleteLanguage**

**Description:**  
Deleting a language/course.

**Body Format:**

```json
{
  "language_id": "String"
}
```

**Response:**

- **200 OK:** Successfully updated note.
- **400 Bad Request:** Missing required fields in the body.
- **404 Bad Request:** Language is not found.
- **500 Internal Server Error:** If there is an issue fetching the note.

### **9. DELETE /deleteNote**

**Description:**  
Deleting a note.

**Body Format:**

```json
{
  "language_id": "String",
  "note_id": "String"
}
```

**Response:**

- **200 OK:** Successfully updated note.
- **400 Bad Request:** Missing required fields in the body.
- **404 Bad Request:** Language or note is not found.
- **500 Internal Server Error:** If there is an issue fetching the note.