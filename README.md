# Thumbnail Server

A server that returns a thumbnail for an uploaded image.

This is an assignment from Cogent Labs.

## Requirements

Docker and docker-compose should be installed.

Run the app server:
```
$ docker-compose up --build
```

Run the test:

```
$ docker-compose -f docker-compose-test.yml up --build
```

## Usage

Once the server is running, the APIs are aviable.

### API List

- POST `/upload`: post an image with a POST request, and get an url for later check.
    - attach: image file (png or jpg)
    - code 202
        - return: `{status: "in_process", url: string}`
    - code 500
        - return: `{status: "server_error"}`
- GET `/check/:id`: ask if the task is finished. Once the task is finished, the output image is encoded as base64.
    - code: 200
        - return: `{status: "done", image: base64_image}`
    - code: 202
        - return: `{status: "in_process", url: string}`
    - code: 404
        - return: `{status: "not_found"}`
    - code: 500
        - return: `{status: "server_error"}`

### example:

Run the server at localhost, and use the other shell to run:

```sh
# POST /upload
$ curl -X POST  -H "Content-Type: multipart/form-data" -F length=200 -F image=@image.jpg http://localhost:8080/upload
{"status":"in_process","url":"/check/617d334a-d277-4351-912a-ff3a9aac8e6f"}

# GET /check/:id
$ curl http://localhost:8080/check/617d334a-d277-4351-912a-ff3a9aac8e6f
{"status":"done","image":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAACXBIWXMAAC4jAAAuIwF4pT92AAAgAElEQVR4nFy6BXhc55n2r4Wv9O1u ... "}
```

## Architecture


![Architecture](https://user-images.githubusercontent.com/18013815/165839038-9e0ea6e8-161a-431c-88d8-0bba0408e14c.png)

- Client: user
- Express: express on Node.js
- Rabbitmq: message queue server
- Redis: cache DB for task information, which include the task ID, original image, and output image
- Worker: Node.js worker thread for handling tasks

Express is used since it's the most famous HTTP framework.
Since there may be a lot of requests, a message queue is nessasary and Rabbitmq is adopted due to its robustness.
We also need a DB to store information for later processing, and Redis, an in-cache memory DBMS, is used because (1) we want a rapid response to save the uploaded image and get the output image, and (2) we don't need to keep the data for a long time, which means we can erase the data soon.

## Future Work

- add a machenism to erase the data in the DB
- add a cancel API
- add a machenism to identify the user
- provide more parameters for API
- add a monitor for each components
- add stress tests (e.g. 10k requests/second)
- add more unit tests for corner cases

## License

MIT
