config API
==========

#### `config.get`

> Returns the currently being used config. If the daemon is off, it returns the stored config.

##### `Go` **WIP**

##### `JavaScript` - ipfs.config.get([key, callback])

`key` is the key of the value that should be fetched from the config file. If no key is passed, then the whole config should be returned. `key` should be of type String.

`callback` must follow `function (err, config) {}` signature, where `err` is an error if the operation was not successful and `config` is a JSON object containing the configuration of the IPFS node.

If no callback is passed, a [promise][] is returned

#### `config.set`

> Adds or replaces a config value.

##### `Go` **WIP**

##### `JavaScript` - ipfs.config.set(key, value, [callback])

`key` is the key value that will be added or replaced (in case of the value already). `key` should be of type String.

`value` value to be set.

`callback` must follow `function (err) {}` signature, where `err` is an error if the operation was not successful.

If no callback is passed, a [promise][] is returned

Note that this operation will **not** spark the restart of any service, i.e: if a config.replace changes the multiaddrs of the Swarm, Swarm will have to be restarted manually for the changes to take difference.

#### `config.replace`

> Adds or replaces a config file.

##### `Go` **WIP**

##### `JavaScript` - ipfs.config.replace(config, [callback])

`config` is a JSON object that contains the new config.

`callback` must follow `function (err) {}` signature, where `err` is an error if the operation was not successful.

If no callback is passed, a [promise][] is returned

Note that this operation will **not** spark the restart of any service, i.e: if a config.replace changes the multiaddrs of the Swarm, Swarm will have to be restarted manually for the changes to take difference.

[promise]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
