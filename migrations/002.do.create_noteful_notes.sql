CREATE TABLE notes (
    id SERIAL PRIMARY KEY,
    note_name TEXT NOT NULL,
    date_modified TIMESTAMPTZ DEFAULT now() NOT NULL,
    "folderId" TEXT
        REFERENCES folders(id) ON DELETE CASCADE NOT NULL,
    content TEXT
    );