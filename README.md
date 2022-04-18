# FrequentQuestions Server
## ***WHAT IS IT?***
    - This is a server created using NodeJs. The main purpose of this server is the serve back data to the user regarding the notes they take. The server uses `Express` and `MONGODB/MONGOOSE` to serve the user notes and courses/languages they requested. 
## ***ROUTES***
1. ### GET --> /
    1. This route returns the languages/courses available. 
2. ### GET --> /:language/getNotes
    1. This route will return the list of notes for a selected language
    2. ERROR 400: When the language passed in does not exist
    3. ERROR 200: When the notes are retreived without any errors
3. ### POST --> /:language
    1. This route creates a new language in the database. 
    2. BODY FORMAT: ```javascript {"name": String}```
    3. ERROR 404: When the language Already Exists
    4. ERROR 400: When an error occurs when creating the new language
    5. ERROR 200: When the new language/course is created successfully, the language and its details are returned.
4. ### POST --> /:language/getNote
    1. This route will get the specific details of a note
    2. BODY FORMAT: ```javascript {"title": String}```
    3. ERROR 400: When the language does not exist or when the note title is not in the language's notes. 
    4. ERROR 200: When the note is retrieved without any erros, the note is sent back. 
5. ### POST --> /:language/newNote
    1. This route is used to insert a new note in the language's database
    2. BODY FORMAT: ```javascript {"title": String, "description": String, "noteDetail": String}```
    3. ERROR 404: When there is an error finding the language (server-side error)
    4. ERROR 400: When the note title already exists 
    5. ERROR 200: When the new note is added without any errors, the language and its details is returned
6. ### PUT --> /:language/updateNote
    1. This route updates a note
    2. BODY FORMAT: ```javascript {"title": String, "description": String, "noteDetail": String, "_id": String}```
    3. ERROR 404: When there is an error updating the note (server-side error)
    4. ERROR 400: When the language or title passed in the body do not exist i the database. 
    5. ERROR 200: When the note is successfully updated, the note is returned
7. ### DELETE --> /:language
    1. This route deletes a language and all its notes
8. ### DELETE --> /:language/deleteNote
    1. This route delete a specific note in a language's database. 
    2. BODY FORMAT: ```javascript {"title": String}```
    3. ERROR 404: When the title is not passed in the body
    4. ERROR 400: When the language does not exist
    5. ERROR 200: When the note is successfully delete.


The link is --> https://frequentquestions.herokuapp.com/languages/
