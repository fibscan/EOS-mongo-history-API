'use strict';

const MAX_ELEMENTS = 1000;
const async = require('async');
const LRU = require("lru-cache");

const options = {
  max: 300,
  // length(n, key) {
  //   return n * 2 + key.length
  // },
  // dispose(key, n) {
  //   n.close();
  // },
  maxAge: 60 * 1000 * 60
}
const cache = LRU(options);

const wrapper = fn =>
  (req, res, next) =>
    Promise
      .resolve(fn(req, res, next))
      .catch(next);

module.exports = (app, DB, swaggerSpec) => {
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
  app.get('/v1/history/get_blocks', wrapper(getBlocks));
  app.get('/v1/history/statistics', wrapper(getBlocks));
  app.get('/v1/history/get_transactions', wrapper(getTransactions));
  app.get('/v1/history/get_account/:name', wrapper(getAccount));
  app.get('/v1/history/get_contract/:name', wrapper(getContract));
  app.get('/v1/history/get_contract_actions/:name', wrapper(getContractActions));
  app.get('/v1/history/get_contract_actions/:name/:action', wrapper(getContractActions));
  /**
   * @swagger
   *
   * /v1/history/get_accounts?counter=on:
   *   get:
   *     description: get_accounts
   *     produces:
   *       - application/json
   *     parameters:
   *       - in: query
   *         name: counter
   *         description: Counter of all EOS Accounts (default off).
   *         required: false
   *         type: string
   *       - in: query
   *         name: skip
   *         description: Skip elements (default 0).
   *         required: false
   *         type: number
   *       - in: query
   *         name: limit
   *         description: Limit elements (default 10).
   *         required: false
   *         type: number
   */
  app.get('/v1/history/get_accounts', getAccounts);

  /**
   * @swagger
   *
   * /v1/history/get_voters/cryptolions1:
   *   get:
   *     description: get_voters
   *     produces:
   *       - application/json
   *     parameters:
   *       - in: query
   *         name: skip
   *         description: Skip elements (default 0).
   *         required: false
   *         type: number
   *       - in: query
   *         name: limit
   *         description: Limit elements (default 100).
   *         required: false
   *         type: number
   */
  app.get('/v1/history/get_voters/:account', getVoters);

  /**
   * @swagger
   *
   * /v1/history/get_actions:
   *   post:
   *     description: get_actions
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               pos:
   *                 type: number
   *                 default: -1
   *               offset:
   *                 type: number
   *                 default: 10
   *               account_name:
   *                 type: string
   *                 default: cryptolions1
   *               action_name:
   *                 type: string
   *                 default: all
   */
  app.post('/v1/history/get_actions', getActionsPOST);

  /**
   * @swagger
   *
   * /v1/history/get_actions/cryptolions1:
   *   get:
   *     description: Get Account actions
   *     produces:
   *       - application/json
   *     parameters:
   *       - in: query
   *         name: skip
   *         description: Skip elements default (0).
   *         required: false
   *         type: number
   *       - in: query
   *         name: limit
   *         description: Limit elements default (10).
   *         required: false
   *         type: number
   *       - in: query
   *         name: sort
   *         description: Sort elements default (-1).
   *         required: false
   *         type: number
   */
  app.get('/v1/history/get_actions/:account', getActions);

  /**
   * @swagger
   *
   * /v1/history/get_actions_unique/cryptolions1:
   *   get:
   *     description: get_actions_unique
   *     produces:
   *       - application/json
   */
  app.get('/v1/history/get_actions_unique/:account', getActionsDistinct);

  /**
   * @swagger
   *
   * /v1/history/get_actions/cryptolions1/sethash:
   *   get:
   *     description: Get Account actions by action name
   *     produces:
   *       - application/json
   *     parameters:
   *       - in: query
   *         name: skip
   *         description: Skip elements default (0).
   *         required: false
   *         type: number
   *       - in: query
   *         name: limit
   *         description: Limit elements default (10).
   *         required: false
   *         type: number
   *       - in: query
   *         name: sort
   *         description: Sort elements default (-1).
   *         required: false
   *         type: number
   */
  app.get('/v1/history/get_actions/:account/:action', getActions);

  /**
   * @swagger
   *
   * /v1/history/get_transaction:
   *   post:
   *     description: get_transaction
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               id:
   *                 type: string
   */
  app.post('/v1/history/get_transaction', getTransactionPOST);

  /**
   * @swagger
   *
   * /v1/history/get_transaction/${id}:
   *   get:
   *     description: Get Transaction by id
   *     produces:
   *       - application/json
   */
  app.get('/v1/history/get_transaction/:id', getTransaction);

  /**
   * @swagger
   *
   * /v1/history/get_controlled_accounts:
   *   post:
   *     description: get_controlled_accounts
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               controlling_account:
   *                 type: string
   */
  app.post('/v1/history/get_controlled_accounts', getControlledAccountsPOST);

  /**
   * @swagger
   *
   * /v1/history/get_controlled_accounts/${controlling_account}:
   *   get:
   *     description: Get controlled accounts
   *     produces:
   *       - application/json
   */
  app.get('/v1/history/get_controlled_accounts/:controlling_account', getControlledAccounts);

  /**
   * @swagger
   *
   * /v1/history/get_key_accounts:
   *   post:
   *     description: get_key_accounts
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               public_key:
   *                 type: string
   */
  app.post('/v1/history/get_key_accounts', getKeyAccountsPOST);

  /**
   * @swagger
   *
   * /v1/history/get_key_accounts/${public_key}:
   *   get:
   *     description: Get key accounts
   *     produces:
   *       - application/json
   */
  app.get('/v1/history/get_key_accounts/:public_key', getKeyAccounts);


  // ========= Custom functions
  function getActions(req, res) {
    // default values
    let skip = 0;
    let limit = 10;
    let sort = -1;
    let accountName = String(req.params.account);
    let action = String(req.params.action);

    let query = {
      $or: [
        { "act.account": accountName },
        { "act.data.receiver": accountName },
        { "act.data.from": accountName },
        { "act.data.to": accountName },
        { "act.data.name": accountName },
        { "act.data.voter": accountName },
        { "act.authorization.actor": accountName }
      ]
    };
    if (action !== "undefined" && action !== "all") {
      query["act.name"] = action;
    }

    skip = (isNaN(Number(req.query.skip))) ? skip : Number(req.query.skip);
    limit = (isNaN(Number(req.query.limit))) ? limit : Number(req.query.limit);
    sort = (isNaN(Number(req.query.sort))) ? sort : Number(req.query.sort);

    if (limit > MAX_ELEMENTS) {
      return res.status(401).send(`Max elements ${MAX_ELEMENTS}!`);
    }
    if (skip < 0 || limit < 0) {
      return res.status(401).send(`Skip (${skip}) || (${limit}) limit < 0`);
    }
    if (sort !== -1 && sort !== 1) {
      return res.status(401).send(`Sort param must be 1 or -1`);
    }

    async.parallel({
      actionsTotal: (callback) => {
        //DB.collection("action_traces").find(query).count(callback);
        //callback(null, "Temporary Unavailable");
        DB.collection("action_traces").aggregate([
          { $match: query },
          { $group: { _id: null, sum: { $sum: 1 } } }
        ]).toArray((err, result) => {
          if (err) {
            return callback(err);
          }
          if (!result || !result[0] || !result[0].sum) {
            return callback('counter error')
          }
          callback(null, result[0].sum);
        });
      },
      actions: (callback) => {
        DB.collection("action_traces").find(query).sort({ "_id": sort }).skip(skip).limit(limit).toArray(callback);
      }
    }, (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).end();
      }
      res.json(result)
    });
  }

  function getActionsPOST(req, res) {
    // default values
    let skip = 0;
    let limit = 10;
    let sort = -1;
    let accountName = String(req.body.account_name);
    let action = String(req.body.action_name);

    let query = {
      $or: [
        { "act.account": accountName },
        { "act.data.receiver": accountName },
        { "act.data.from": accountName },
        { "act.data.to": accountName },
        { "act.data.name": accountName },
        { "act.data.voter": accountName },
        { "act.authorization.actor": accountName }
      ]
    };
    if (action !== "undefined") {
      query["act.name"] = action;
    }

    let pos = Number(req.body.pos);
    let offset = Number(req.body.offset);
    if (!isNaN(pos) && !isNaN(offset)) {
      sort = (pos < 0) ? -1 : 1;
      limit = Math.abs(offset);
      skip = Math.abs(offset * (pos * -1 - 1));
    }

    if (limit > MAX_ELEMENTS) {
      return res.status(401).send(`Max elements ${MAX_ELEMENTS}!`);
    }
    if (skip < 0 || limit < 0) {
      return res.status(401).send(`Skip (${skip}) || (${limit}) limit < 0`);
    }
    if (sort !== -1 && sort !== 1) {
      return res.status(401).send(`Sort param must be 1 or -1`);
    }

    async.parallel({
      actionsTotal: (callback) => {
        //DB.collection("action_traces").find(query).count(callback);
        //callback(null, "Temporary Unavailable");
        DB.collection("action_traces").aggregate([
          { $match: query },
          { $group: { _id: null, sum: { $sum: 1 } } }
        ]).toArray((err, result) => {
          if (err) {
            return callback(err);
          }
          if (!result || !result[0] || !result[0].sum) {
            return callback('counter error')
          }
          callback(null, result[0].sum);
        });
      },
      actions: (callback) => {
        DB.collection("action_traces").find(query).sort({ "_id": sort }).skip(skip).limit(limit).toArray(callback);
      }
    }, (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).end();
      }
      res.json(result)
    });
  }

  function getActionsDistinct(req, res) {
    // default values
    let accountName = String(req.params.account);
    let query = {
      $or: [
        { "act.account": accountName },
        { "act.data.receiver": accountName },
        { "act.data.from": accountName },
        { "act.data.to": accountName },
        { "act.data.name": accountName },
        { "act.data.voter": accountName },
        { "act.authorization.actor": accountName }
      ]
    };

    DB.collection("action_traces").distinct("act.name", query, (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).end();
      }
      ;
      res.json(result);
    });
  }

  async function getTransactions(req, res) {
    let skip = 0;
    let limit = 10;
    let sort = -1;
    res.json({
      transactions: await DB.collection("transactions").find({
        'actions.0.account': { $ne: 'eosio' },
        'actions.0.name': { $ne: 'onblock' }
      }).limit(limit).skip(skip).sort({ createdAt: sort }).toArray()
    });
  }

  async function getBlocks(req, res) {
    let skip = 0;
    let limit = 10;
    let sort = -1;
    res.json({ blocks: await DB.collection("blocks").find({}).limit(limit).skip(skip).sort({ block_num: sort }).toArray() });
  }

  function getTransactionPOST(req, res) {
    let key = String(req.body.id);
    if (key === "undefined") {
      return res.status(401).send("Wrong transactions ID!");
    }
    let query = { id: key };
    DB.collection("transaction_traces").findOne(query, (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).end();
      }
      ;
      res.json(result);
    });
  }

  function getTransaction(req, res) {
    let key = String(req.params.id);
    if (key === "undefined") {
      return res.status(401).send("Wrong transactions ID!");
    }
    let query = { id: key };
    DB.collection("transaction_traces").findOne(query, (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).end();
      };
      res.json(result);
    });
  }

  function getControlledAccountsPOST(req, res) {
    let key = String(req.body.controlling_account);
    if (key === "undefined") {
      return res.status(401).send("Wrong transactions ID!");
    }
    let query = { controlling_account: key };
    DB.collection("account_controls").find(query).toArray((err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).end();
      }
      ;
      res.json(result);
    });
  }

  function getControlledAccounts(req, res) {
    let key = String(req.params.controlling_account);
    if (key === "undefined") {
      return res.status(401).send("Wrong transactions ID!");
    }
    let query = { controlling_account: key };
    DB.collection("account_controls").find(query).toArray((err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).end();
      }
      ;
      res.json(result);
    });
  }

  function getKeyAccountsPOST(req, res) {
    let key = String(req.body.public_key);
    if (key === "undefined") {
      return res.status(401).send("Wrong transactions ID!");
    }
    let query = { public_key: key };
    DB.collection("pub_keys").find(query).toArray((err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).end();
      }
      ;
      res.json(result);
    });
  }

  function getKeyAccounts(req, res) {
    let key = String(req.params.public_key);
    if (key === "undefined") {
      return res.status(401).send("Wrong transactions ID!");
    }
    let query = { public_key: key };
    DB.collection("pub_keys").find(query).toArray((err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).end();
      }
      ;
      res.json(result);
    });
  }

  function getAccounts(req, res) {
    let skip = 0;
    let limit = 10;
    let counterAccounts = false;
    let accountName = String(req.query.account);

    let query = {};
    if (accountName !== "undefined") {
      query.name = accountName;
    }

    skip = (isNaN(Number(req.query.skip))) ? skip : Number(req.query.skip);
    limit = (isNaN(Number(req.query.limit))) ? limit : Number(req.query.limit);
    counterAccounts = (req.query.counter === "on") ? true : false;

    if (limit > MAX_ELEMENTS) {
      return res.status(401).send(`Max limit accounts per query = ${MAX_ELEMENTS}`);
    }
    if (skip < 0 || limit < 0) {
      return res.status(401).send(`Skip (${skip}) || (${limit}) limit < 0`);
    }

    DB.collection("accounts").find(query).skip(skip).limit(limit).toArray((err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).end();
      }
      ;
      if (counterAccounts) {
        DB.collection("accounts").count((err, accs) => {
          if (err) {
            console.error(err);
            return res.status(500).end();
          }
          ;
          res.json({ allEosAccounts: accs, accounts: result });
        });
      } else {
        res.json({ accounts: result });
      }
    });
  }

  async function getAccount(req, res) {
    const createdBy = (await DB.collection("action_traces").find({
      'act.account': 'eosio',
      'act.name': 'newaccount',
      'act.data.name': req.params.name
    }).toArray())[0];

    const setCodeTimes = await DB.collection('action_traces').countDocuments(
      { 'act.account': 'eosio', 'act.name': 'setcode', 'act.data.account': req.params.name }
    );
    const producer = await DB.collection("action_traces").find({
      'act.account': 'eosio',
      'act.name': {
        $in: ['regproducer', 'unregprod']
      },
      'act.data.producer': req.params.name
    }).sort({ _id: -1 }).limit(1).toArray();
    const isProducer = producer[0] ? producer[0].act.name === 'regproducer' : false;
    const ret = {
      account: req.params.name,
      createdBy: createdBy ? createdBy.act.data.creator : null,
      isContract: setCodeTimes > 0,
      isProducer
    };
    res.json(ret);
  }

  async function getContract(req, res) {
    const setCodeTimes = await DB.collection('action_traces').countDocuments(
      { 'act.account': 'eosio', 'act.name': 'setcode', 'act.data.account': req.params.name }
    );
    let lastSetCode;
    let firstSetCode;
    let actionCount = 0;
    if (setCodeTimes > 0) {
      // actionCount = await DB.collection('action_traces').countDocuments(
      //   { 'act.account': req.params.name }
      // );
      lastSetCode = (await DB.collection('action_traces').find(
        { 'act.account': 'eosio', 'act.name': 'setcode', 'act.data.account': req.params.name }
      ).sort({ _id: -1 }).limit(1).toArray())[0];
      lastSetCode = { block_time: lastSetCode.block_time }
      firstSetCode = (await DB.collection('action_traces').find(
        { 'act.account': 'eosio', 'act.name': 'setcode', 'act.data.account': req.params.name }
      ).sort({ _id: 1 }).limit(1).toArray())[0];
      firstSetCode = { block_time: firstSetCode.block_time }
    }

    const ret = {
      lastSetCode,
      firstSetCode,
      setCodeTimes,
      // actionCount
    };
    res.json(ret);
  }

  function getContractActions(req, res) {
    // default values
    let skip = 0;
    let limit = 10;
    let sort = -1;
    let contractName = String(req.params.name);
    let action = String(req.params.action);

    let query = {};
    if (contractName !== 'undefined') {
      query["act.account"] = contractName;
    }
    if (action !== "undefined" && action !== "all") {
      query["act.name"] = action;
    }

    skip = (isNaN(Number(req.query.skip))) ? skip : Number(req.query.skip);
    limit = (isNaN(Number(req.query.limit))) ? limit : Number(req.query.limit);
    sort = (isNaN(Number(req.query.sort))) ? sort : Number(req.query.sort);

    if (limit > MAX_ELEMENTS) {
      return res.status(401).send(`Max elements ${MAX_ELEMENTS}!`);
    }
    if (skip < 0 || limit < 0) {
      return res.status(401).send(`Skip (${skip}) || (${limit}) limit < 0`);
    }
    if (sort !== -1 && sort !== 1) {
      return res.status(401).send(`Sort param must be 1 or -1`);
    }

    async.parallel({
      actionsTotal: (callback) => {
        const cacheKey = JSON.stringify(query);
        const cachedValue = cache.get(cacheKey);
        if (cachedValue) {
          callback(null, cachedValue);
          return;
        }
        //DB.collection("action_traces").find(query).count(callback);
        //callback(null, "Temporary Unavailable");
        DB.collection("action_traces").aggregate([
          { $match: query },
          { $group: { _id: null, sum: { $sum: 1 } } }
        ]).toArray((err, result) => {
          if (err) {
            return callback(err);
          }
          if (!result || !result[0] || !result[0].sum) {
            return callback('counter error')
          }
          cache.set(cacheKey, result[0].sum);
          callback(null, result[0].sum);
        });
      },
      actions: (callback) => {
        DB.collection("action_traces").find(query).sort({ "_id": sort }).skip(skip).limit(limit).toArray(callback);
      }
    }, (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).end();
      }
      res.json(result)
    });
  }

  function getVoters(req, res) {
    // default values
    let skip = 0;
    let limit = 100;
    let sort = -1;
    let accountName = String(req.params.account);

    let query = { "act.name": "voteproducer", "act.data.producers": { $in: [accountName] } };

    skip = (isNaN(Number(req.query.skip))) ? skip : Number(req.query.skip);
    limit = (isNaN(Number(req.query.limit))) ? limit : Number(req.query.limit);
    sort = (isNaN(Number(req.query.sort))) ? sort : Number(req.query.sort);

    if (limit > MAX_ELEMENTS) {
      return res.status(401).send(`Max elements ${MAX_ELEMENTS}!`);
    }
    if (skip < 0 || limit < 0) {
      return res.status(401).send(`Skip (${skip}) || (${limit}) limit < 0`);
    }
    if (sort !== -1 && sort !== 1) {
      return res.status(401).send(`Sort param must be 1 or -1`);
    }

    async.parallel({
      votesCounter: (callback) => {
        DB.collection("action_traces").find(query).count(callback);
      },
      voters: (callback) => {
        DB.collection("action_traces").find(query).sort({ "_id": sort }).skip(skip).limit(limit).toArray(callback);
      }
    }, (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).end();
      }
      res.json(result)
    });
  }

  //========= end Custom Functions
}



