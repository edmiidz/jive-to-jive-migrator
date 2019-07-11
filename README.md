## Jive to Jive Document Migrator

The Jive to Jive migrator is a script which synchronizes all of the documents of one Jive place to another.  It would be from one instance to another or within the same instance. It includes both collaborative documents as well as binary documents also known as files. In the case of collaborative document, it will include all of the embedded images and attachments, and similar for files with rich text descriptions.
For all documents it will include:
 - Original Author (only if matching user exists in destination instance)
 - Creation Date
 - All Tags
 - Categories (only if they exist in destination place)

It will not include:
Old versions, comments, Likes and other aclaims.


## Future Considerations

Migrating of other objects, such as ideas, discussion, questions, status updates, blogs and videos.

## Requirements
- Node.js
- MySQL Database
