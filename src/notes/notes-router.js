const express = require("express");
const NotesService = require("./notes-service");
const path = require("path");
const xss = require("xss");

const notesRouter = express.Router();
const jsonParser = express.json();

const serializeNote = note => ({
  id: note.id,
  folderId: note.folderId,
  note_name: xss(note.note_name),
  content: xss(note.content),
  date_modified: note.date_modified
});

notesRouter
  .route("/")
  .get((req, res, next) => {
    NotesService.getAllNotes(req.app.get("db"))
      .then(notes => {
        res.json(notes.map(serializeNote));
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const { note_name, folderId, content, date_modified } = req.body;
    const newNote = { note_name, folderId, content, date_modified };

    for (const [key, value] of Object.entries(newNote)) {
      if (value == null && !value == content) {
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
        });
      }
    }
    NotesService.insertNote(req.app.get("db"), newNote)
      .then(note => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${note.id}`))
          .json(serializeNote(note));
      })
      .catch(next);
  });

notesRouter
  .route("/:note_id")
  .all((req, res, next) => {
    NotesService.getById(req.app.get("db"), req.params.note_id)
      .then(note => {
        if (!note) {
          return res.status(404).json({
            error: { message: `Note doesn't exist` }
          });
        }
        res.note = note; // save the note for the next middleware
        next(); // don't forget to call next so the next middleware happens!
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.json({
      id: res.note.id,
      folderId: res.note.folderId,
      note_name: res.note.note_name,
      content: res.note.content,
      date_modified: res.note.date_modified
    });
  })
  .delete((req, res, next) => {
    NotesService.deleteNote(req.app.get("db"), req.params.note_id)
      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(jsonParser, (req, res, next) => {
    const { id, note_name, folderId, content, date_modified } = req.body;
    const noteToUpdate = { id, note_name, folderId, content, date_modified };

    const numberOfValues = Object.values(noteToUpdate).filter(Boolean).length;
    if (numberOfValues === 0) {
      return res.status(400).json({
        error: {
          message: `Request body must contain either 'note_name', 'id'`
        }
      });
    }

    NotesService.updateNote(req.app.get("db"), req.params.note_id, noteToUpdate)
      .then(numRowsAffected => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = notesRouter;
