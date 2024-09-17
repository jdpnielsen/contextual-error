# Contextual Error: Rich errors in Typescript with causes

![NPM Version](https://img.shields.io/npm/v/%40jdpnielsen%2Fcontextual-error)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)

The Contextual Error module is a rewrite of Joyent's excellent [verror](https://github.com/joyent/node-verror) in Typescript. The port is _not exactly_ a drop in replacement, as several features has been dropped, while others have been added.

This module extends the base Error class with several features which makes the Error class better suited for operational errors in modern Javascript workflows using promises in a async/await workflow. Please see Joyent's [Best Practices for Error Handling in Node.js](http://www.joyent.com/developers/node/design/errors) if you find any of the behavior here confusing or surprising.

The error classes here support:

* Chains of causes
* Properties to provide extra information about the error
* Creating your own subclasses that support all of these

The classes here are:

* **CError**, for chaining errors while preserving each one's error message.
  This is useful in servers and command-line utilities when you want to
  propagate an error up a call stack, but allow various levels to add their own
  context.  See examples below.
* **WError**, for wrapping errors while hiding the lower-level messages from the
  top-level error.  This is useful for API endpoints where you don't want to
  expose internal error messages, but you still want to preserve the error chain
  for logging and debugging.


# Quick start

First, install the package:

    npm install @jdpnielsen/contextual-error

If nothing else, you can use CError as a drop-in replacement for the built-in
JavaScript Error class:

```ts
import CError from '@jdpnielsen/contextual-error';
var err = new CError('missing file: "/etc/passwd"');
console.log(err.message);
```

This prints:

    missing file: "/etc/passwd"

You can also pass a `cause` argument, which is any other Error object:

```typescript
import CError from '@jdpnielsen/contextual-error';
import fs from 'fs/promises';
var filename = '/nonexistent';

try {
  const stats = await fs.stat(filename); 
} catch (err1) {
	var err2 = new CError(`stat "${filename}"`, { cause: err1 });
	console.error(err2.message);
}

```

This prints out:

    stat "/nonexistent": ENOENT, stat '/nonexistent'

which resembles how Unix programs typically report errors:

    $ sort /nonexistent
    sort: open failed: /nonexistent: No such file or directory

To match the Unixy feel, when you print out the error, just prepend the
program's name to the CError's `message`.

You can get the next-level Error using `CError.cause()`:

```typescript
console.error(CError.cause(err2).message);
```

prints:

    ENOENT, stat '/nonexistent'

Of course, you can chain these as many times as you want, and it works with any
kind of Error:

```typescript
const err1 = new Error('No such file or directory');
const err2 = new CError(`failed to stat ${filename}`, { cause: err1 });
const err3 = new CError('request failed', { cause: err2 });
console.error(err3.message);
```

This prints:

    request failed: failed to stat "/junk": No such file or directory

The idea is that each layer in the stack annotates the error with a description
of what it was doing. The end result is a message that explains what happened
at each level.

You can also decorate Error objects with additional information so that callers
can not only handle each kind of error differently, but also construct their own
error messages (e.g., to localize them, format them, group them by type, and so
on). See the example below.


# Deeper dive

The two main goals for CError are:

* **Make it easy to construct clear, complete error messages intended for
  people.**  Clear error messages greatly improve both user experience and
  debuggability, so we wanted to make it easy to build them.  That's why the
  constructor takes printf-style arguments.
* **Make it easy to construct objects with programmatically-accessible
  metadata** (which we call _informational properties_).  Instead of just saying
  "connection refused while connecting to 192.168.1.2:80", you can add
  properties like `"ip": "192.168.1.2"` and `"tcpPort": 80`.  This can be used
  for feeding into monitoring systems, analyzing large numbers of Errors (as
  from a log file), or localizing error messages.

To really make this useful, it also needs to be easy to compose Errors:
higher-level code should be able to augment the Errors reported by lower-level
code to provide a more complete description of what happened.  Instead of saying
"connection refused", you can say "operation X failed: connection refused".
That's why CError supports `causes`.

In order for all this to work, programmers need to know that it's generally safe
to wrap lower-level Errors with higher-level ones.  If you have existing code
that handles Errors produced by a library, you should be able to wrap those
Errors with a CError to add information without breaking the error handling
code.  There are two obvious ways that this could break such consumers:

* The error's name might change.  People typically use `name` to determine what
  kind of Error they've got.  To ensure compatibility, you can create CErrors
  with custom names, but this approach isn't great because it prevents you from
  representing complex failures.  For this reason, CError provides
  `findCauseByName`, which essentially asks: does this Error _or any of its
  causes_ have this specific type?  If error handling code uses
  `findCauseByName`, then subsystems can construct very specific causal chains
  for debuggability and still let people handle simple cases easily.  There's an
  example below.
* The error's properties might change.  People often hang additional properties
  off of Error objects.  If we wrap an existing Error in a new Error, those
  properties would be lost unless we copied them.  But there are a variety of
  both standard and non-standard Error properties that should _not_ be copied in
  this way: most obviously `name`, `message`, and `stack`, but also `fileName`,
  `lineNumber`, and a few others.  Plus, it's useful for some Error subclasses
  to have their own private properties -- and there'd be no way to know whether
  these should be copied.  For these reasons, CError first-classes these
  information properties.  You have to provide them in the constructor, you can
  only fetch them with the `info()` function, and CError takes care of making
  sure properties from causes wind up in the `info()` output.

Let's put this all together with an example from the node-fast RPC library.
node-fast implements a simple RPC protocol for Node programs.  There's a server
and client interface, and clients make RPC requests to servers.  Let's say the
server fails with an UnauthorizedError with message "user 'bob' is not
authorized".  The client wraps all server errors with a FastServerError.  The
client also wraps all request errors with a FastRequestError that includes the
name of the RPC call being made.  The result of this failed RPC might look like
this:

    name: FastRequestError
    message: "request failed: server error: user 'bob' is not authorized"
    rpcMsgid: <unique identifier for this request>
    rpcMethod: GetObject
    cause:
        name: FastServerError
        message: "server error: user 'bob' is not authorized"
        cause:
            name: UnauthorizedError
            message: "user 'bob' is not authorized"
            rpcUser: "bob"

When the caller uses `CError.info()`, the information properties are collapsed
so that it looks like this:

    message: "request failed: server error: user 'bob' is not authorized"
    rpcMsgid: <unique identifier for this request>
    rpcMethod: GetObject
    rpcUser: "bob"

Taking this apart:

* The error's message is a complete description of the problem.  The caller can
  report this directly to its caller, which can potentially make its way back to
  an end user (if appropriate).  It can also be logged.
* The caller can tell that the request failed on the server, rather than as a
  result of a client problem (e.g., failure to serialize the request), a
  transport problem (e.g., failure to connect to the server), or something else
  (e.g., a timeout).  They do this using `findCauseByName('FastServerError')`
  rather than checking the `name` field directly.
* If the caller logs this error, the logs can be analyzed to aggregate
  errors by cause, by RPC method name, by user, or whatever.  Or the
  error can be correlated with other events for the same rpcMsgid.
* It wasn't very hard for any part of the code to contribute to this Error.
  Each part of the stack has just a few lines to provide exactly what it knows,
  with very little boilerplate.

It's not expected that you'd use these complex forms all the time.  Despite
supporting the complex case above, you can still just do:

   new CError("my service isn't working");

for the simple cases.


# Reference: CError, WError

CError and WError are convenient drop-in replacements for `Error` that
support first-class causes, informational properties and other useful features.


## Constructors

The CError constructor takes 2 optional arguments:

```typescript
new CError(message, options)
```

All of these forms construct a new CError that behaves just like the built-in
JavaScript `Error` class, with some additional methods described below.

In the first form, `options` is a plain object with any of the following
optional properties:

Option name      | Type             | Meaning
---------------- | ---------------- | -------
`cause`          | Error            | Idicates the specific original cause of the error. See [mdn web docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause)
`name`           | string           | Describes what kind of error this is.  This is intended for programmatic use to distinguish between different kinds of errors.  Note that in modern versions of Node.js, this name is ignored in the `stack` property value, but callers can still use the `name` property to get at it. See [mdn web docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/name)
`info`           | object           | Specifies arbitrary informational properties that are available through the `CError.info(err)` static class method.  See that method for details.

The `WError` constructor is used exactly the same way as the `CError`
constructor.

## Public properties

`CError` and `WError` all provide the same public properties as
JavaScript's built-in Error objects.

Property name | Type   | Meaning
------------- | ------ | -------
`name`        | string | Programmatically-usable name of the error.
`cause`       | Error? | original cause of the error
`message`     | string | Human-readable summary of the failure.  Programmatically-accessible details are provided through `CError.info(err)` class method.
`stack`       | string | Human-readable stack trace where the Error was constructed.

The `stack` property is managed entirely by the underlying JavaScript
implementation.  It's generally implemented using a getter function because
constructing the human-readable stack trace is somewhat expensive.

## Class methods

The following methods are defined on the `CError` class and as exported
functions on the `CError` module.  They're defined this way rather than using
methods on CError instances so that they can be used on Errors not created with
`CError`.

### `CError.isCError(err)`

The `isCError()` function returns a boolean, if the provided error is an instance
of CError or an instance of a class which inherited from CError. Under the hood,
the method uses a Symbol for checking, rather than `err instanceof CError`. This
allows compatability between versions of this library.

### `CError.getCause(err)`

The `getCause()` function returns the next Error in the cause chain for `err`, or
`null` if there is no next error.  See the `cause` argument to the constructor.
Errors can have arbitrarily long cause chains.  You can walk the `cause` chain
by invoking `CError.getCause(err)` on each subsequent return value.  If `err` is
not a `CError`, the cause is `null`.

### `CError.info(err)`

Returns an object with all of the extra error information that's been associated
with this Error and all of its causes.  These are the properties passed in using
the `info` option to the constructor.  Properties not specified in the
constructor for this Error are implicitly inherited from this error's cause.

These properties are intended to provide programmatically-accessible metadata
about the error.  For an error that indicates a failure to resolve a DNS name,
informational properties might include the DNS name to be resolved, or even the
list of resolvers used to resolve it.  The values of these properties should
generally be plain objects (i.e., consisting only of null, undefined, numbers,
booleans, strings, and objects and arrays containing only other plain objects).

### `CError.fullStack(err)`

Returns a string containing the full stack trace, with all nested errors recursively
reported as `'caused by:' + err.stack`.

### `CError.findCauseByName(err, name)`

The `findCauseByName()` function traverses the cause chain for `err`, looking
for an error whose `name` property matches the passed in `name` value. If no
match is found, `null` is returned.

If all you want is to know _whether_ there's a cause (and you don't care what it
is), you can use `CError.hasCauseWithName(err, name)`.

If a vanilla error or a non-CError error is passed in, then there is no cause
chain to traverse. In this scenario, the function will check the `name`
property of only `err`.

### `CError.hasCauseWithName(err, name)`

Returns true if and only if `CError.findCauseByName(err, name)` would return
a non-null value.  This essentially determines whether `err` has any cause in
its cause chain that has name `name`.

## Examples

The "Quick start" section above covers several basic cases.  Here's a more advanced
case:

```typescript
const err1 = new CError('something bad happened');
/* ... */
const err2 = new CError( `failed to connect to "${ip}:${port}"`, {
  'cause': err1,
  'name': 'ConnectionError',
  'info': {
      'errno': 'ECONNREFUSED',
      'remote_ip': ip,
      'port': port
  }
});

console.log(err2.message);
console.log(err2.name);
console.log(CError.info(err2));
console.log(err2.stack);
```

This outputs:

    failed to connect to "127.0.0.1:215": something bad happened
    ConnectionError
    { errno: 'ECONNREFUSED', remote_ip: '127.0.0.1', port: 215 }
    ConnectionError: failed to connect to "127.0.0.1:215": something bad happened
        at Object.<anonymous> (/home/jdpnielsen/cerror/examples/info.js:5:12)
        at Module._compile (module.js:456:26)
        at Object.Module._extensions..js (module.js:474:10)
        at Module.load (module.js:356:32)
        at Function.Module._load (module.js:312:12)
        at Function.Module.runMain (module.js:497:10)
        at startup (node.js:119:16)
        at node.js:935:3

Information properties are inherited up the cause chain, with values at the top
of the chain overriding same-named values lower in the chain. To continue that
example:

```typescript
const err3 = new CError('request failed', {
  'cause': err2,
  'name': 'RequestError',
  'info': {
      'errno': 'EBADREQUEST'
  }
});

console.log(err3.message);
console.log(err3.name);
console.log(CError.info(err3));
console.log(err3.stack);
```

This outputs:

    request failed: failed to connect to "127.0.0.1:215": something bad happened
    RequestError
    { errno: 'EBADREQUEST', remote_ip: '127.0.0.1', port: 215 }
    RequestError: request failed: failed to connect to "127.0.0.1:215": something bad happened
        at Object.<anonymous> (/home/jdpnielsen/cerror/examples/info.js:20:12)
        at Module._compile (module.js:456:26)
        at Object.Module._extensions..js (module.js:474:10)
        at Module.load (module.js:356:32)
        at Function.Module._load (module.js:312:12)
        at Function.Module.runMain (module.js:497:10)
        at startup (node.js:119:16)
        at node.js:935:3

You can also print the complete stack trace of combined `Error`s by using
`CError.fullStack(err).`

```typescript
var err1 = new CError('something bad happened');
/* ... */
var err2 = new CError('something really bad happened here', { cause: err1 });

console.log(CError.fullStack(err2));
```

This outputs:

    CError: something really bad happened here: something bad happened
        at Object.<anonymous> (/home/jdpnielsen/cerror/examples/fullStack.js:5:12)
        at Module._compile (module.js:409:26)
        at Object.Module._extensions..js (module.js:416:10)
        at Module.load (module.js:343:32)
        at Function.Module._load (module.js:300:12)
        at Function.Module.runMain (module.js:441:10)
        at startup (node.js:139:18)
        at node.js:968:3
    caused by: CError: something bad happened
        at Object.<anonymous> (/home/jdpnielsen/cerror/examples/fullStack.js:3:12)
        at Module._compile (module.js:409:26)
        at Object.Module._extensions..js (module.js:416:10)
        at Module.load (module.js:343:32)
        at Function.Module._load (module.js:300:12)
        at Function.Module.runMain (module.js:441:10)
        at startup (node.js:139:18)
        at node.js:968:3

`CError.fullStack` is also safe to use on regular `Error`s, so feel free to use
it whenever you need to extract the stack trace from an `Error`, regardless if
it's a `CError` or not.
