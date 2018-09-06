var express = require('express');
var bodyParser = require('body-parser');
var sql = require("mssql");
var app = express();
var fs = require("fs");
var Web3 = require('web3');
var request = require('request');
var crypto = require('crypto');
const abiDecoder = require('abi-decoder');
let web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('http://13.82.91.127:8102'));
app.use(bodyParser.json());
// Add headers
app.use(function(req, res, next) {

	// Website you wish to allow to connect
	res.setHeader('Access-Control-Allow-Origin', '*');

	// Request methods you wish to allow
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

	// Request headers you wish to allow
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

	// Set to true if you need the website to include cookies in the requests sent
	// to the API (e.g. in case you use sessions)
	res.setHeader('Access-Control-Allow-Credentials', true);

	// Pass to next layer of middleware
	next();
});
// Set the account from where we perform out contract transactions
web3.eth.defaultAccount = web3.eth.coinbase;
var creditscoreContract, creditscore, flag, Connection, Request, TYPES, msSqlConnecter, connection, testdata;
var dbConfig;

fs.readFile(__dirname + "/" + "creditscoreabi.json", 'utf8', function(err, data) {
	// console.log(typeof(data))
	creditscoreContract = web3.eth.contract(JSON.parse(data));
	creditscore = creditscoreContract.at('0x18ab73f9b035ee8074660761b63e664fb7eb0f6c');

	flag = false;
	// Connection = require('tedious').Connection;
	// Request = require('tedious').Request;
	// TYPES = require("tedious").TYPES;
	// msSqlConnecter = require("./msSqlConnecter");
	abiDecoder.addABI(JSON.parse(data));
	// var config = {
	// 	userName: 'dataware', // update me
	// 	password: 'Celebal@1234', // update me
	// 	server: "datawarempqxi6rtp4ycqdatawarehouse.database.windows.net", // update me
	// 	options: {
	// 		database: 'indus' //update me
	// 			,
	// 		encrypt: true
	// 	}
	// }
	// connection = new Connection(config);
	dbConfig = {
		user: "sa",
		password: "mssql@123",
		server: "40.71.86.193",
		database: "blockchain"
	};
	testdata = data
});

app.get('/checkserver', function(req, res) {
	res.end(testdata)
});

app.post('/getAccountBalance', function(req, res) {
	console.log(req.body.address)
	xa = web3.eth.getBalance(req.body.address);
	var d = {};
	d['bal'] = JSON.parse(xa) / 1.e18;
	d['address'] = req.body.address;
	res.end(JSON.stringify(d));
	console.log(d)
});

app.post('/registerBank', function(req, res) {
	// console.log(req.body)

	var pvtKey = crypto.randomBytes(32).toString('hex')
	request({
		uri: "http://13.82.91.127:8102/",
		method: "POST",
		json: true,
		body: {
			jsonrpc: "2.0",
			method: "personal_importRawKey",
			params: [pvtKey, "01"],
			id: 15
		}
	}, function(error, response, body) {
		var bankaccountaddress = body.result,
			bankname = req.body.bankname,
			bankregisteredaddress = req.body.regaddress;
		web3.eth.sendTransaction({
			from: web3.eth.defaultAccount,
			to: bankaccountaddress,
			value: web3.toWei(1.0, "ether")
		});
		console.log("BankNew"+bankaccountaddress);
		var output = {};
		output["accountpvtKey"] = pvtKey;
		creditscore.registerBank(bankaccountaddress, bankname, {
			gas: 500000
		}, function(err, result) {
			if (err) {
				console.log(err);
				res.end(JSON.stringify(err));
			}
			console.log(result);
			output["TransactionID"] = result;
			if (result) {
				output["TransactionMine"] = printTransaction(result);
				output["logs"] = readLogs(result);
				output['accountAddredd'] = bankaccountaddress;
				var txReceipt = web3.eth.getTransactionReceipt(result);
				if (txReceipt.logs.length > 0) {
					const decodedLogs = abiDecoder.decodeLogs(txReceipt.logs);
					 var _bankID = decodedLogs[0].events[0].value;
					console.log(decodedLogs[0].name);
					console.log(_bankID);

					if (decodedLogs[0].name === "BankAdded") {
						var query = "INSERT INTO BANK (BANKID,BANKACCOUNTADDRESS,BANKNAME,CITY) VALUES ('" + _bankID + "','"  + bankaccountaddress + "','" + bankname + "','" + bankregisteredaddress + "');"
						console.log(query);
						console.log("test");
						executeQuery(res, query, output);
						// connection.on('connect', function(err) {
						// 	if (err) {
						// 		console.log(err);
						// 	} else {
						// 		console.log("connected");
						// 		var con = new msSqlConnecter.msSqlConnecter(config);
						// 		con.connect().then(function() {
						// 				new con.Request("INSERT INTO BANK VALUES (@BANKID,@BANKACCOUNTADDRESS,@BANKNAME,@CITY)", function(err, result) {
						// 						if (err) {
						// 							console.error(err);
						// 						} else {
						// 							console.log(result);
						// 							// console.log("hello");
						// 						}
						// 					})
						// 					.addParam("BANKID", TYPES.VarChar, _bankID)
						// 					.addParam("BANKACCOUNTADDRESS", TYPES.VarChar, bankaccountaddress)
						// 					.addParam("BANKNAME", TYPES.VarChar, bankname)
						// 					.addParam("CITY", TYPES.VarChar, bankregisteredaddress)
						// 					.onComplate(function(count) {
						// 						// console.log(output);
						// 						res.end(JSON.stringify(output))
						// 					})
						// 					// .onrequestCompleted(function () {console.log(output);return output;})
						// 					.onError(function(err) {
						// 						console.log(err);
						// 					})
						// 					.Run()
						// 			}) //.then(function(){})
						// 			.catch(function(ex) {
						// 				console.log(ex);
						// 			});
						// 		console.log("Bank Added");
						// 	}
						// })
						res.end(JSON.stringify(output));

					} else {
						// console.log(output);
						// return output;
						res.end(JSON.stringify(output));
					}
				}
			} else {
				console.error(err);
			}
			res.end(JSON.stringify(output));

		});
	});
});

app.post('/registerAgency', function(req, res) {

	var pvtKey = crypto.randomBytes(32).toString('hex')
	request({
		uri: "http://13.82.91.127:8102/",
		method: "POST",
		json: true,
		body: {
			jsonrpc: "2.0",
			method: "personal_importRawKey",
			params: [pvtKey, "01"],
			id: 15
		}
	}, function(error, response, body) {
		console.log(req.body)
		var collectionAgencyAccountAddress = body.result,
			collectionagencyname = req.body.bankname;
		web3.eth.sendTransaction({
			from: web3.eth.defaultAccount,
			to: collectionAgencyAccountAddress,
			value: web3.toWei(1.0, "ether")
		});

		var output = {};
		output["accountpvtKey"] = pvtKey;

		// console.log(collectionAgencyAccountAddress);
		creditscore.registerCollectionAgency(collectionagencyname, collectionAgencyAccountAddress, {
			gas: 500000
		}, function(err, result) {
			if (err) {
				console.log(err);
				res.end(JSON.stringify(err));
			}
			console.log(result);
			output["TransactionID"] = result;
			output['accountAddredd'] = collectionAgencyAccountAddress;
			if (result) {
				output["TransactionMine"] = printTransaction(result);
				output["logs"] = readLogs(result);
				// if(result)
				// printTransaction(result);
				// readLogs(result);
				var txReceipt = web3.eth.getTransactionReceipt(result);
				if (txReceipt.logs.length > 0) {
					const decodedLogs = abiDecoder.decodeLogs(txReceipt.logs);
					var _collectionAgency = decodedLogs[0].events[0].value;
					console.log(decodedLogs[0].name);
					// console.log(CUID);

					if (decodedLogs[0].name === "CollectionAgencyAdded") {
						var query = "INSERT INTO COLLECTIONAGENCY VALUES ('" + _collectionAgency + "','" + collectionagencyname + "','" + collectionAgencyAccountAddress + "')";
						executeQuery(res, query, output);
						// connection.on('connect', function(err) {
						// 	if (err) {
						// 		console.log(err);
						// 	} else {
						// 		console.log("connected");
						// 		var con = new msSqlConnecter.msSqlConnecter(config);
						// 		con.connect().then(function() {
						// 			new con.Request("INSERT INTO COLLECTIONAGENCY VALUES (@COLLECTIONAGENCYID,@COLLECTIONAGENCYNAME,@COLLECTIONAGENCYACCOUNTADDRESS)")
						// 				.addParam("COLLECTIONAGENCYID", TYPES.VarChar, _collectionAgency)
						// 				.addParam("COLLECTIONAGENCYNAME", TYPES.VarChar, collectionagencyname)
						// 				.addParam("COLLECTIONAGENCYACCOUNTADDRESS", TYPES.VarChar, collectionAgencyAccountAddress)
						// 				.onComplate(function(count) {
						// 					res.end(JSON.stringify(output))
						// 					console.log(output);
						// 				})
						// 				.onError(function(err) {
						// 					console.log(err);
						// 				})
						// 				.Run();
						// 		}).catch(function(ex) {
						// 			console.log(ex);
						// 		});
						// 		console.log("Collection Agency  Added");
						// 	}
						// })
						res.end(JSON.stringify(output));

					} else {

						res.end(JSON.stringify(output));
					}
				} else {
					res.end(JSON.stringify(output));

				}
			}
			res.end(JSON.stringify(output));

		});

	});
});

app.post('/registerCompany', function(req, res) {
	var pvtKey = crypto.randomBytes(32).toString('hex')
	request({
		uri: "http://13.82.91.127:8102/",
		method: "POST",
		json: true,
		body: {
			jsonrpc: "2.0",
			method: "personal_importRawKey",
			params: [pvtKey, "01"],
			id: 15
		}
	}, function(error, response, body) {
		console.log('error:', error);
		console.log('statusCode:', response && response.statusCode);
		console.log('body:', body);
		// return body.result;

		var companyAccountAddress = body.result,
			companyName = req.body.bankname,
			registeredAddress = req.body.regaddress;
		web3.eth.sendTransaction({
			from: web3.eth.defaultAccount,
			to: companyAccountAddress,
			value: web3.toWei(1.0, "ether")
		});
		console.log(companyAccountAddress);
		var output = {};
		output["accountpvtKey"] = pvtKey;

		creditscore.registerCompany(companyAccountAddress, companyName, registeredAddress, {
			gas: 500000
		}, function(err, result) {
			if (err) {
				console.log(err);
				res.end(JSON.stringify(err));
			}
			console.log(result);
			output["TransactionID"] = result;
			output['accountAddredd'] = companyAccountAddress;
			if (result) {
				output["TransactionMine"] = printTransaction(result);
				output["logs"] = readLogs(result);
				var txReceipt = web3.eth.getTransactionReceipt(result);
				if (txReceipt.logs.length > 0) {
					const decodedLogs = abiDecoder.decodeLogs(txReceipt.logs);
					var CUID = decodedLogs[0].events[0].value;
					console.log(decodedLogs[0].name);
					console.log(CUID);

					if (decodedLogs[0].name === "CompanyAdded") {
						var query = "INSERT INTO COMPANY VALUES ('" + CUID + "','" + companyName + "','" + registeredAddress + "','" + companyAccountAddress + "')";
						executeQuery(res, query, output);
						// var CUID = decodedLogs[0].events[1].value;
						// console.log(CUID);
						// console.log("updating db...");
						// connectTODB();
						// connection.on('connect', function(err) {
						// 	if (err) {
						// 		console.log(err);
						// 	} else {
						// 		var con = new msSqlConnecter.msSqlConnecter(config);
						// 		con.connect().then(function() {
						// 			console.log("updating..");
						// 			new con.Request("INSERT INTO COMPANY VALUES (@COMPANYID,@COMPANYNAME,@COMPANYREGISTEREDADDRESS,@COMPANYACCOUNTADDRESS)")
						// 				.addParam("COMPANYID", TYPES.VarChar, CUID)
						// 				.addParam("COMPANYNAME", TYPES.VarChar, companyName)
						// 				.addParam("COMPANYREGISTEREDADDRESS", TYPES.VarChar, registeredAddress)
						// 				.addParam("COMPANYACCOUNTADDRESS", TYPES.VarChar, companyAccountAddress)
						// 				.onComplate(function(count) {
						// 					console.log(output);
						// 					res.end(JSON.stringify(output))
						// 				})
						// 				.onError(function(err) {
						// 					console.log(err);
						// 				})
						// 				.Run();
						// 		}).catch(function(ex) {
						// 			console.log(ex);
						// 		});
						// 	}
						// });
						res.end(JSON.stringify(output));

					} else {
						res.end(JSON.stringify(output))
						console.log("Company Already Exist.");
					}
				} else {
					res.end(JSON.stringify(output))

				}
			}
			res.end(JSON.stringify(output));

		});
	});
});

app.post('/initiateNewB2C', function(req, res) {
	console.log(req.body);
		console.log("test");
	var bankAccountAddress = req.body.address,
		companyID = req.body.companyid,
		bankAccountNumber = req.body.bankano,
		amountDue = req.body.amountdue,
		accType = req.body.accounttype;
		console.log("test");
	var output = {};
	var test = 1536486;
	creditscore.initiateNewB2C(companyID, bankAccountNumber, amountDue, accType,test, {
		from: bankAccountAddress,
		gas: 500000
	}, function(err, result) {
		if (err) {
			console.log(err);
			res.end(JSON.stringify(err));
		}
		console.log("test");
		console.log(result);
		output["TransactionID"] = result;
		output['accountAddredd'] = req.body.address;
			console.log("test");
		if (result) {
				console.log("test");
			output["TransactionMine"] = printTransaction(result);
			output["logs"] = readLogs(result);
			// var tx = web3.eth.getTransaction(result);
			// if (tx != null)
			// {
			// 	while(tx.blockNumber==null)
			// 	{
			// 		var tx = web3.eth.getTransaction(result);
			// 	}
			// }
			var txReceipt = web3.eth.getTransactionReceipt(result);
			console.log(txReceipt);
				console.log("test");
			if (txReceipt.logs.length > 0) {
				const decodedLogs = abiDecoder.decodeLogs(txReceipt.logs);
				console.log(decodedLogs[0].name);
				console.log("test");

				if (decodedLogs[0].name === "newCreditTransactionBanktoCompany") {
					var currentDate = new Date(Date.now()).toMysqlFormat();
					console.log(currentDate);
					var query = "INSERT INTO TRANSACTIONB2C (TRANSACTIONID,COMPANYID,BANKACCOUNTNUMBER,AMOUNTDUE,PAYMENTDATE,TRANSACTIONTYPE,ACCOUNTTYPE) VALUES ('" + result + "','" + companyID + "','" + bankAccountNumber + "'," + amountDue + "," + currentDate + ",1," + accType + ")";
					executeQuery(res, query, output);
					// connection.on('connect', function(err) {
					// 	if (err) {
					// 		console.log(err)
					// 	} else {
					// 		console.log("CONNECTED");
					// 		var con = new msSqlConnecter.msSqlConnecter(config);
					// 		con.connect().then(function() {
					// 			new con.Request("INSERT INTO TRANSACTIONB2C (TRANSACTIONID,COMPANYID,BANKID,BANKACCOUNTNUMBER,AMOUNTDUE,TRANSACTIONTYPE,ACCOUNTTYPE) VALUES (@TRANSACTIONID,@COMPANYID,@BANKID,@BANKACCOUNTNUMBER,@AMOUNTDUE,@TRANSACTIONTYPE,@ACCOUNTTYPE)")
					// 				.addParam("TRANSACTIONID", TYPES.VarChar, result)
					// 				.addParam("COMPANYID", TYPES.VarChar, companyID)
					// 				.addParam("BANKID", TYPES.VarChar, bankID)
					// 				.addParam("BANKACCOUNTNUMBER", TYPES.VarChar, bankAccountNumber)
					// 				.addParam("AMOUNTDUE", TYPES.Float, amountDue)
					// 				.addParam("PAYMENTDATE", TYPES.VarChar, new Date(Date.now()).toLocaleString())
					// 				.addParam("TRANSACTIONTYPE", TYPES.TinyInt, 1)
					// 				.addParam("ACCOUNTTYPE", TYPES.TinyInt, accType)
					// 				.onComplate(function(count) {
					// 					console.log(output);
					// 					res.end(JSON.stringify(output));
					// 				})
					// 				.onError(function(err) {
					// 					console.log(err);
					// 				})
					// 				.Run();
					// 		}).catch(function(ex) {
					// 			console.log(ex);
					// 		});
					// 		console.log("New Transaction Initiate by Bank to Company");
					// 	}
					// });
					

				} else {
					res.end(JSON.stringify(output));
					console.log("Error in Transaction");
				}
			} else {
				res.end(JSON.stringify(output));
				console.log("Account Already Issued.");
			}
		}
		res.end(JSON.stringify(output));

	});
});

app.post('/addCompanyToBankTxn', function(req, res) {
	var bankAccountAddress = req.body.address,
		companyID = req.body.companyid,
		bankAccountNumber = req.body.bankano,
		installmentAmount = req.body.installmentamount,
		duedate = req.body.duedate,
		daysinarrear = req.body.daysinarrear,
		paymentDate = req.body.paymentdate,
		accountbalance = req.body.abalance;
	console.log(req.body);
	var output = {};
	creditscore.addCompanyToBankTx(companyID, bankAccountNumber, installmentAmount, duedate, daysinarrear, paymentDate, accountbalance, {
		from: bankAccountAddress,
		gas: 500000
	}, function(err, result) {
		if (err) {
			console.log(err);
			res.end(JSON.stringify(err));
		}
		console.log(result);
		output["TransactionID"] = result;
		if (result) {
			output["TransactionMine"] = printTransaction(result);
			output["logs"] = readLogs(result);
			var txReceipt = web3.eth.getTransactionReceipt(result);
			if (txReceipt.logs.length > 0) {
				const decodedLogs = abiDecoder.decodeLogs(txReceipt.logs);
				console.log(decodedLogs[0].name);

				if (decodedLogs[0].name === "newDebitTransactionBanktoCompany") {
					// paymentdate = (new Date(paymentDate * 1000)).toMysqlFormat();
					// console.log(paymentdate);
					var query = "INSERT INTO TRANSACTIONB2C (TRANSACTIONID,COMPANYID,BANKACCOUNTNUMBER,INSTALLMENTAMOUNT,DUEDATE,PAYMENTDATE,DAYSINARREAR,TRANSACTIONTYPE,ACCOUNTBALANCE) VALUES ('" + result + "','" + companyID + "','" + bankAccountNumber + "'," + installmentAmount + ",'" + (new Date(duedate * 1000)).toMysqlFormat() + "','" + (new Date(paymentDate * 1000)).toMysqlFormat() + "'," + (daysinarrear - duedate) / 84200 + ",2," + accountbalance + ")"
					// var query = "INSERT INTO TRANSACTIONB2C ('" + result + "','" + companyID + "','" + bankID + "','" + bankAccountNumber + "'," + installmentAmount + "," + (new Date(duedate * 1000)).toMysqlFormat() + "," + (new Date(paymentDate * 1000)).toMysqlFormat() + "," + (daysinarrear - duedate) / 84200 + ",2," + accountbalance + ")";
					console.log(query)
					executeQuery(res, query, output);
					// connection.on('connect', function(err) {
					// 	if (err) {
					// 		console.log(err)
					// 	} else {
					// 		console.log("CONNECTED");
					// 		var con = new msSqlConnecter.msSqlConnecter(config);
					// 		con.connect().then(function() {
					// 			new con.Request("INSERT INTO TRANSACTIONB2C (TRANSACTIONID,COMPANYID,BANKID,BANKACCOUNTNUMBER,INSTALLMENTAMOUNT,DUEDATE,DAYSINARREAR,PAYMENTDATE,ACCOUNTBALANCE) VALUES (@TRANSACTIONID,@COMPANYID,@BANKID,@BANKACCOUNTNUMBER,@INSTALLMENTAMOUNT,@DUEDATE,@DAYSINARREAR,@PAYMENTDATE,@ACCOUNTBALANCE)")
					// 				.addParam("TRANSACTIONID", TYPES.VarChar, result)
					// 				.addParam("COMPANYID", TYPES.VarChar, companyID)
					// 				.addParam("BANKID", TYPES.VarChar, bankID)
					// 				.addParam("BANKACCOUNTNUMBER", TYPES.VarChar, bankAccountNumber)
					// 				.addParam("INSTALLMENTAMOUNT", TYPES.Float, installmentAmount)
					// 				.addParam("DUEDATE", TYPES.Date, new Date(duedate))
					// 				.addParam("PAYMENTDATE", TYPES.Date, new Date(paymentDate))
					// 				.addParam("DAYSINARREAR", TYPES.TinyInt, daysinarrear)
					// 				.addParam("TRANSACTIONTYPE", TYPES.TinyInt, 2)
					// 				.addParam("ACCOUNTBALANCE", TYPES.Float, accountbalance)
					// 				.onComplate(function(count) {
					// 					res.end(JSON.stringify(output));
					// 					console.log(output);
					// 				})
					// 				.onError(function(err) {
					// 					console.log(err);
					// 				})
					// 				.Run();
					// 		}).catch(function(ex) {
					// 			console.log(ex);
					// 		});
					// 		console.log("New Debit Transaction by Bank to Company");
					// 	}
					// });
					res.end(JSON.stringify(output));

				} else {
					res.end(JSON.stringify(output));

				}
			} else {
				res.end(JSON.stringify(output));

			}
		} else {
			res.end(JSON.stringify(output));

		}
	});
});

app.post('/checkcreditscore', function(req, res) {
	var lenderAccountAddress = req.body.address,
		//_checker = req.body.bankid,
		_target = req.body.companyid;
	var output = {};
	creditscore.checkCreditScoreOFCompany(_target, {
		from: lenderAccountAddress
	}, function(err, result) {
		if (err) {
			console.error(err);
		} else {
			console.log(result);
			output["CreditScore"] = result;
			console.log(output);
		}
		res.end(JSON.stringify(output));
	});
});

app.post('/delayonpayment', function(req, res) {
	var Owneraddress = req.body.address,
		// _bankID = req.body.bankid,
		_companyID = req.body.companyid,
		_bankAccountNumber = req.body.bankano,
		_installmentAmount = req.body.installmentamount,
		_dueDate = req.body.duedate,
		_delayDays = req.body.delaydays;
	var output = {};
	// console.log(req.body)
	creditscore.delayOnPaymentC2B(_companyID, _bankAccountNumber, _installmentAmount, _dueDate, _delayDays, {
		from: Owneraddress,
		gas: 500000
	}, function(err, result) {
		if (err) {
			console.log(err);
			res.end(JSON.stringify(err));
		}
		console.log(result);
		output["TransactionID"] = result;
		// output["logs"]
		if (result) {
			output["TransactionMine"] = printTransaction(result);
			output["logs"] = readLogs(result);
			var query = "INSERT INTO TRANSACTIONB2C (TRANSACTIONID,COMPANYID,BANKACCOUNTNUMBER,INSTALLMENTAMOUNT,DAYSINARREAR,DUEDATE) VALUES ('" + result + "','" + _companyID + "','" + _bankAccountNumber + "'," + _installmentAmount + "," + _delayDays + "," + (new Date(_dueDate * 1000)).toMysqlFormat() + ")";
			// var query = "INSERT INTO TRANSACTIONB2C ('" + result + "','" + companyID + "','" + bankID + "','" + bankAccountNumber + "'," + installmentAmount + "," + (new Date(duedate * 1000)).toMysqlFormat() + "," + (new Date(paymentDate * 1000)).toMysqlFormat() + "," + (daysinarrear - duedate) / 84200 + ",2," + accountbalance + ")";
			console.log(query)
			executeQuery(res, query, output);
		}
		res.end(JSON.stringify(output));
		console.log(output);
	})
});

app.post('/updateArrearTime', function(req, res) {
	var Owneraddress = req.body.address,
		// _collectionAgencyID = req.body.caid,
		_lenderID = req.body.lenderid,
		_companyID = req.body.companyid,
		_contractIDOrbankAccountNumber = req.body.bankano,
		arrearDays = req.body.daysinarrear,
		payment_due_date = req.body.payment_due_date,
		payment_due_amount = req.body.payment_due_amount;
		_delayReason = req.body.delayreason,

	// _delayReason=0;
	console.log(req.body);
	console.log(typeof(_contractIDOrbankAccountNumber));
	var output = {};
	creditscore.updateArrearTime(_lenderID, _companyID, _contractIDOrbankAccountNumber, arrearDays, payment_due_date, payment_due_amount, _delayReason, {
		from: Owneraddress,
		gas: 500000
	}, function(err, result) {
		if (err) {
			console.log(err);
			res.end(JSON.stringify(err));
		}
		console.log(result);
		output["TransactionID"] = result;
		if (result) {
			output["TransactionMine"] = printTransaction(result);
			output["logs"] = readLogs(result);
		}
		// var x = {
		// 	"TransactionID": "0xfc0fc7b631ff327918b476e5e9737502219e9b3be715e31b9dd2c002c39c7477",
		// 	"TransactionMine": {
		// 		"TransactionDetails": {
		// 			"blockHash": "0xf55f416baba86bfd39bdd20b76d4f413019a7c687faac1bb7fd282345ef954fc",
		// 			"blockNumber": 1049,
		// 			"from": "0x7d60f0c0c46d6e0cdba39d2fa94af20151d7d03b",
		// 			"gas": 500000,
		// 			"gasPrice": "18000000000",
		// 			"hash": "0xfc0fc7b631ff327918b476e5e9737502219e9b3be715e31b9dd2c002c39c7477",
		// 			"input": "0x9ddd453818922e357bf10dcc9f42c697f4aaf698fe91d3834bc6878a92d67e557b951c2e7d46a8c9354c1378a6d5cdb32f6a4e94a28bf47a73b0444421ce04a3754ba21e9a2f6620342e5eb58aaff63b8bdd708e9c23c36430fbdc056b42892138d33b7e75bcd150000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000000000000000000005b21b00000000000000000000000000000000000000000000000000000000000000003e8000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000024e41000000000000000000000000000000000000000000000000000000000000",
		// 			"nonce": 0,
		// 			"to": "0x4ce301bd86a6fc91a9aaaa87ebfc41d23e34fa42",
		// 			"transactionIndex": 0,
		// 			"value": "0",
		// 			"v": "0x42",
		// 			"r": "0x6ebb48d52dfec53d3dfaefa00c0d106091daa850f4e4a5defb128099988d9ae",
		// 			"s": "0x55d304ce19241f8d30a1f62def3b9d3e29a12b1f53c9436d2cd74480fd425763"
		// 		},
		// 		"OprationName": "updateArrearTime",
		// 		"OprationData": [{
		// 			"name": "_collectionAgencyID",
		// 			"value": "0x18922e357bf10dcc9f42c697f4aaf698fe91d3834bc6878a92d67e557b951c2e",
		// 			"type": "bytes32"
		// 		}, {
		// 			"name": "_lenderID",
		// 			"value": "0x7d46a8c9354c1378a6d5cdb32f6a4e94a28bf47a73b0444421ce04a3754ba21e",
		// 			"type": "bytes32"
		// 		}, {
		// 			"name": "_companyID",
		// 			"value": "0x9a2f6620342e5eb58aaff63b8bdd708e9c23c36430fbdc056b42892138d33b7e",
		// 			"type": "bytes32"
		// 		}, {
		// 			"name": "_contractIDOrbankAccountNumber",
		// 			"value": "0x75bcd15000000000000000000000000000000000000000000000000000000000",
		// 			"type": "bytes32"
		// 		}, {
		// 			"name": "_arrearDays",
		// 			"value": "20",
		// 			"type": "uint256"
		// 		}, {
		// 			"name": "_dueDate",
		// 			"value": "1528934400",
		// 			"type": "uint256"
		// 		}, {
		// 			"name": "_amount",
		// 			"value": "1000",
		// 			"type": "uint256"
		// 		}, {
		// 			"name": "_delayReason",
		// 			"value": "NA",
		// 			"type": "string"
		// 		}]
		// 	},
		// 	"logs": {
		// 		"EventName": "DelayReason",
		// 		"EventData": [{
		// 			"name": "CollectionAgencyID",
		// 			"type": "bytes32",
		// 			"value": "0x18922e357bf10dcc9f42c697f4aaf698fe91d3834bc6878a92d67e557b951c2e"
		// 		}, {
		// 			"name": "LenderID",
		// 			"type": "bytes32",
		// 			"value": "0x7d46a8c9354c1378a6d5cdb32f6a4e94a28bf47a73b0444421ce04a3754ba21e"
		// 		}, {
		// 			"name": "CompanyID",
		// 			"type": "bytes32",
		// 			"value": "0x9a2f6620342e5eb58aaff63b8bdd708e9c23c36430fbdc056b42892138d33b7e"
		// 		}, {
		// 			"name": "contractIDOrbankAccountNumber",
		// 			"type": "bytes32",
		// 			"value": "0x75bcd15000000000000000000000000000000000000000000000000000000000"
		// 		}, {
		// 			"name": "ExtraArrearDays",
		// 			"type": "uint256",
		// 			"value": "20"
		// 		}, {
		// 			"name": "PaymentDueDate",
		// 			"type": "uint256",
		// 			"value": "1528934400"
		// 		}, {
		// 			"name": "Amount",
		// 			"type": "uint256",
		// 			"value": "1000"
		// 		}, {
		// 			"name": "DelayReason",
		// 			"type": "string",
		// 			"value": "NA"
		// 		}]
		// 	}
		// };
		console.log(output);

		res.end(JSON.stringify(output));
	});
});

app.post('/initiateC2CTxn', function(req, res) {
	// web3.eth.defaultAccount = compnayAA;
	// console.log(creditscore);
	var companyAccountAddress = req.body.address,
		company1ID = req.body.company1id,
		contractID = req.body.contractid;
	var output = {};
	var test = 1452456
	console.log("test");
	creditscore.initiateNewC2C(company1ID, contractID,test, {
		from: companyAccountAddress,
		gas: 500000
	}, function(err, result) {
		console.log("test");
		console.log(result);
		if (err) {
			console.log(err);
			res.end(JSON.stringify(err));
		}
		output["TransactionID"] = result;
		if (result) {
			output["TransactionMine"] = printTransaction(result);
			output["logs"] = readLogs(result);
			var txReceipt = web3.eth.getTransactionReceipt(result);
			// console.log(txReceipt);
			// console.log(txReceipt);
			if (txReceipt.logs.length > 0) {
				const decodedLogs = abiDecoder.decodeLogs(txReceipt.logs);
				// var CUID = decodedLogs[0].events[0].value;
				console.log(decodedLogs[0].name);

				if (decodedLogs[0].name === "newContractCompanytoCompany") {
					var query = "INSERT INTO TRANSACTIONC2C (TRANSACTIONID,COMPANY1ID,CONTRACTID) VALUES ('" + result + "','" + company1ID + "','" + contractID + "')"
					// var query ="INSERT INTO TRANSACTIONB2C (TRANSACTIONID,COMPANYID,BANKID,BANKACCOUNTNUMBER,INSTALLMENTAMOUNT,AMOUNTDUE,PAYMENTDATE,DAYSINARREAR,TRANSACTIONTYPE,ACCOUNTBALANCE) VALUES ('" + result + "','" + companyID + "','" + bankID + "','" + bankAccountNumber + "'," + installmentAmount + "," + (new Date(duedate * 1000)).toMysqlFormat() + "," + (new Date(paymentDate * 1000)).toMysqlFormat() + "," + (daysinarrear - duedate) / 84200 + ",2," + accountbalance + ")"
					// var query = "INSERT INTO TRANSACTIONB2C ('" + result + "','" + companyID + "','" + bankID + "','" + bankAccountNumber + "'," + installmentAmount + "," + (new Date(duedate * 1000)).toMysqlFormat() + "," + (new Date(paymentDate * 1000)).toMysqlFormat() + "," + (daysinarrear - duedate) / 84200 + ",2," + accountbalance + ")";
					console.log(query)
					executeQuery(res, query, output);
					// connection.on('connect', function(err) {
					// 	if (err) {
					// 		console.log(err)
					// 	} else {
					// 		console.log("CONNECTED");
					// 		var con = new msSqlConnecter.msSqlConnecter(config);
					// 		con.connect().then(function() {
					// 			new con.Request("INSERT INTO TRANSACTIONC2C (TRANSACTIONID,COMPANY1ID,COMPANY2ID,CONTRACTID) VALUES (@TRANSACTIONID,@COMPANY1ID,@COMPANY2ID,@CONTRACTID)")
					// 				.addParam("TRANSACTIONID", TYPES.VarChar, result)
					// 				.addParam("COMPANY1ID", TYPES.VarChar, company1ID)
					// 				.addParam("COMPANY2ID", TYPES.VarChar, company2ID)
					// 				.addParam("CONTRACTID", TYPES.VarChar, contractID)
					// 				// .addParam("AMOUNT",TYPES.Float, amount)
					// 				// .addParam("DUEDATE",TYPES.Date,new Date(Date.now()).toLocaleString())
					// 				// .addParam("PAYMENTDATE",TYPES.VarChar,paymentdate)
					// 				// .addParam("DAYSINARREAR",TYPES.TinyInt,daysinArrearrrear)
					// 				.addParam("TRANSACTIONTYPE", TYPES.TinyInt, 1)
					// 				// .addParam("ACCOUNTTYPE",TYPES.TinyInt,txCategory)
					// 				//.addParam("EXTRAARREARDAYS",TYPES.VarChar,extradays)
					// 				// .addParam("OUTSTANDINGBALANCE",TYPES.Float,accountbalance)
					// 				.onComplate(function(count) {
					// 					res.end(JSON.stringify(output));
					// 					console.log(output);
					// 				})
					// 				.onError(function(err) {
					// 					console.log(err);
					// 				})
					// 				.Run();
					// 		}).catch(function(ex) {
					// 			console.log(ex);
					// 		});
					// 		console.log("Transaction Added");
					// 		//  connection.close();

					// 	}
					// });
					res.end(JSON.stringify(output));

				} else {
					res.end(JSON.stringify(output));
					console.log("Transaction Already Exist.");
				}
			}
		} else {
			res.end(JSON.stringify(output));
		}
	});
});

app.post('/AddC2CTxn', function(req, res) {
	var companyAccountAddress = req.body.address,
		company1ID = req.body.company1id,
		contractID = req.body.contractid,
		invoiceNumber = req.body.invoiceno,
		installmentAmount = req.body.iamount,
		duedate = req.body.duedate,
		paymentDate = 1502320505,
		daysinarrear = req.body.daysinarrear,
		outstandingBalance = req.body.obalance;
	var output = {};
	creditscore.addCompanyToCompanyTx(company1ID, contractID, invoiceNumber, installmentAmount, duedate, paymentDate, daysinarrear, outstandingBalance, {
		from: companyAccountAddress,
		gas: 500000
	}, function(err, result) {
		if (err) {
			console.log(err);
			res.end(JSON.stringify(err));
		}        
		console.log(result);
		output["TransactionID"] = result;
		if (result) {
			output["TransactionMine"] = printTransaction(result);
			output["logs"] = readLogs(result);
			var txReceipt = web3.eth.getTransactionReceipt(result);
			// console.log(txReceipt);
			if (txReceipt.logs.length > 0) {
				const decodedLogs = abiDecoder.decodeLogs(txReceipt.logs);
				// var CUID = decodedLogs[0].events[0].value;
				console.log(decodedLogs[0].name);
				// console.log(CUID);

				if (decodedLogs[0].name === "newDebitTransactionCompanytoCompany") {
					var query = "INSERT INTO TRANSACTIONC2C (TRANSACTIONID,COMPANY1ID,CONTRACTID,INVOICENUMBER,INSTALLMENTAMOUNT,DUEDATE,DAYSINARREAR,PAYMENTDATE,OUTSTANDINGBALANCE) VALUES ('" + result + "','" + company1ID + "','" + contractID + "','" + invoiceNumber + "'," + installmentAmount + ",'" + (new Date(duedate)).toMysqlFormat() + "'," + (duedate - daysinarrear) / 84200 + ",'" + (new Date(paymentDate)).toMysqlFormat() + "'," + outstandingBalance + ")"
					console.log(query);
					executeQuery(res, query, output)
					// connection.on('connect', function(err) {
					// 	if (err) {
					// 		console.log(err)
					// 	} else {
					// 		console.log("CONNECTED");
					// 		var con = new msSqlConnecter.msSqlConnecter(config);
					// 		con.connect().then(function() {
					// 			new con.Request("INSERT INTO TRANSACTIONC2C (TRANSACTIONID,COMPANY1ID,COMPANY2ID,CONTRACTID,INVOICENUMBER,INSTALLMENTAMOUNT,DUEDATE,DAYSINARREAR,PAYMENTDATE,OUTSTANDINGBALANCE) VALUES (@TRANSACTIONID,@COMPANY1ID,@COMPANY2ID,@CONTRACTID,@INVOICENUMBER,@INSTALLMENTAMOUNT,@DUEDATE,@DAYSINARREAR,@PAYMENTDATE,@OUTSTANDINGBALANCE)")
					// 				.addParam("TRANSACTIONID", TYPES.VarChar, result)
					// 				.addParam("COMPANY1ID", TYPES.VarChar, company1ID)
					// 				.addParam("COMPANY2ID", TYPES.VarChar, company2ID)
					// 				.addParam("CONTRACTID", TYPES.VarChar, contractID)
					// 				.addParam("INVOICENUMBER", TYPES.VarChar, invoiceNumber)
					// 				.addParam("INSTALLMENTAMOUNT", TYPES.Float, installmentAmount)
					// 				.addParam("DUEDATE", TYPES.Date, new Date(duedate))
					// 				.addParam("PAYMENTDATE", TYPES.Date, new Date(paymentDate))
					// 				.addParam("DAYSINARREAR", TYPES.TinyInt, daysinarrear)
					// 				.addParam("TRANSACTIONTYPE", TYPES.TinyInt, 2)
					// 				// .addParam("ACCOUNTTYPE",TYPES.TinyInt,txCategory)
					// 				//.addParam("EXTRAARREARDAYS",TYPES.VarChar,extradays)
					// 				.addParam("OUTSTANDINGBALANCE", TYPES.Float, outstandingBalance)
					// 				.onComplate(function(count) {
					// 					res.end(JSON.stringify(output));
					// 					console.log(output);
					// 				})
					// 				.onError(function(err) {
					// 					console.log(err);
					// 				})
					// 				.Run();
					// 		}).catch(function(ex) {
					// 			console.log(ex);
					// 		});
					// 		console.log("New Debit Transaction by Company to Company");
					// 		//  connection.close();
					// 	}
					// });
					res.end(JSON.stringify(output));

				} else {
					res.end(JSON.stringify(output));
					console.log("Transaction Already Exist.");
				}
			} else {
				res.end(JSON.stringify(output));
				console.log("logs not generated");
			}
		}
		res.end(JSON.stringify(output));

	});
});

app.post('/GetProfile', function(req, res) {
	var address = req.body.address,
		C_UID = req.body.companyid;
	var output = {};
	creditscore.queryCompanyDetails({
		from: address
	}, function(err, result) {
		// console.log(result);

		if (result) {
			output["COMPANYID"] = result[0];
			output["Name"] = result[1];
			output["Credit Score "] = result[2];
			output["Registered Address "] = result[3];
		}
		// console.log("  COMPANYID          	: " + result[0] + "\n"
		// 	+ "   Name           	: " + result[1] + "\n"
		// 	+ "   Credit Score      	: " + result[2] + "\n"
		// 	+ "   Registered Address   : " + result[3]);
		// process.exit();
		console.log(output);
		res.end(JSON.stringify(output));

	});
});

app.post('/AllTxn', function(req, res) {
	var address = req.body.address,
		_between = req.body.lendertype,
		no_transaction = req.body.no_transaction;
	console.log(req.body);
	var output = {};
	creditscore.totalTransaction(_between,{
		from: address
	}, function(err, result) {
		if (err) {
			console.log(err);
			res.end(JSON.stringify(err));
		}
		count = JSON.parse(result);
		output["Total Transaction"] = count;

		if (no_transaction < count) {
			count = no_transaction;
		}
		console.log(count);
		if (count != 0) {
			// var flag = 0;
			var f = 0;
			if (_between == 2) {
				for (var i = 0; i < count; i++) {
					creditscore.retriveCollectionAgencyTxOnDelay( i, {
						from: address
					}, function(err, result) {
						console.log(result);
						output[f] = [];
						if (result) {
							output[f].push({
								"collectionAgencyID": result[0]
							});
							output[f].push({
								"lenderID": result[1]
							});
							output[f].push({
								"contractIDOrbankAccountNumber": result[2]
							});
							output[f].push({
								"arrearDays": result[3]
							});
							output[f].push({
								"dueDate": result[4]
							});
							output[f].push({
								"delayReason": result[5]
							});
						}

						console.log(output);
						f++;
						// console.log(flag);
						if (f == count) {
							res.end(JSON.stringify(output));

							// process.exit();
						}
					});
				}
				// res.end(output);
				// res.end(JSON.stringify(output));
			} else if (_between == 1) {
				for (var i = 0; i < count; i++) {
					// while (output[i] == null || i==count) {

					creditscore.retriveTransactionsB2C(i, {
						from: address
					}, function(err, result) {
						output[f] = [];

						// console.log(result);
						if (result) {
							output[f].push({
								"bankAccountNumber": result[0]
							});
							// output[f].push({
							// 	"bankID": result[1]
							// });
							output[f].push({
								"installmentAmount": result[2]
							});
							output[f].push({
								"txType": result[3]
							});
							output[f].push({
								"dueDate": result[4]
							});
							output[f].push({
								"paymentDate": result[5]
							});
							// f++;
						}

						console.log(output);
						f++;
						// console.log(flag);
						if (f == count) {
							res.end(JSON.stringify(output));

							// process.exit();
						}
					});
					// }
				}
				// res.end(output);
				// res.end(JSON.stringify(output));
			} else if (_between == 0) {
				for (var i = 0; i < count; i++) {
					creditscore.retriveTransactionC2C(i, {
						from: address
					}, function(err, result) {
						output[f] = [];

						// console.log(result);
						if (result) {
							output[f].push({
								"company1ID": result[0]
							});
							output[f].push({
								"contractID": result[1]
							});
							output[f].push({
								"installmentAmount": result[2]
							});
							output[f].push({
								"dueDate": result[3]
							});
							output[f].push({
								"daysinArrear": result[4]
							});
							output[f].push({
								"txType": result[5]
							});
						}
						f++;
						// console.log(flag);
						if (f == count) {
							// process.exit();
							res.end(JSON.stringify(output));

						}
					});
				}
				// res.end(output);
				// res.end(JSON.stringify(output));
			}
		} else {
			res.end(JSON.stringify({
				"Number of Transaction": 0
			}));
		}
	});
});

app.post('/GiveAccess', function(req, res) {
	var companyAccountAddress = req.body.address,
		LenderID = req.body.lenderid,
		start_date = 1502320505,
		end_date = 1602320505;
		
	console.log(req.body);
	var output = {};
	creditscore.giveAccessToCompany(LenderID, start_date,end_date, {
		from: companyAccountAddress,
		gas: 500000
	}, function(err, result) {
		console.log(result);
		output["TransactionMine"] = printTransaction(result);
		output["logs"] = readLogs(result);
		output["TransactionId"] = result;
		res.end(JSON.stringify(output));
	});
})

app.post('/LoginHere', function(req, res) {
	console.log(req.body)
	request({
		uri: "http://13.82.91.127:8102/",
		method: "POST",
		json: true,
		body: {
			jsonrpc: "2.0",
			method: "personal_unlockAccount",
			params: [req.body.aaddress, req.body.password, 999999],
			id: 15
		}
	}, function(error, response, body) {
		console.log('error:', error);
		console.log('statusCode:', response && response.statusCode);
		console.log('body:', body);
		res.end(JSON.stringify(body))
	});
})
/***************************************************************Blockchain Explorer**************************************************************************/
function printTransaction(txHash) {
	var output = {};
	var tx = web3.eth.getTransaction(txHash);

	if (tx != null) {
		while (tx.blockNumber == null) {
			var tx = web3.eth.getTransaction(txHash);
		}
		//	  console.log(tx.length());
		output["TransactionDetails"] = tx;
		console.log("  tx hash          : " + tx.hash + "\n" +
			"   nonce           : " + tx.nonce + "\n" +
			"   blockHash       : " + tx.blockHash + "\n" +
			"   blockNumber     : " + tx.blockNumber + "\n" +
			"   transactionIndex: " + tx.transactionIndex + "\n" +
			"   from            : " + tx.from + "\n" +
			"   to              : " + tx.to + "\n" +
			"   value           : " + tx.value + "\n" +
			"   gasPrice        : " + tx.gasPrice + "\n" +
			"   gas             : " + tx.gas
		);
		console.log("   ----------input---------- ");
		const data = abiDecoder.decodeMethod(tx.input);
		if (data != null) {
			output["OprationName"] = data.name;
			console.log(
				"	Opration Name 	: " + data.name + "\n" +
				"	-----------params----------- "
			);
			output["OprationData"] = [];
			data.params.forEach(function(para) {
				output["OprationData"].push(para);
				console.log(
					"	" + para.name + " 		: " + para.value
				);
			});
		}
	}
	return output;
}

function readLogs(txHash) {
	var output = {};
	var txReceipt = web3.eth.getTransactionReceipt(txHash);
	// console.log(txReceipt);
	// console.log(txReceipt.logs);
	if (txReceipt.logs.length > 0) {
		const decodedLogs = abiDecoder.decodeLogs(txReceipt.logs);
		output["EventName"] = decodedLogs[0].name;
		console.log(
			"	Event Name 	: " + decodedLogs[0].name + "\n" +
			"	-----------params----------- "
		);
		output["EventData"] = [];
		decodedLogs[0].events.forEach(function(para) {
			output["EventData"].push(para);
			console.log(
				"	" + para.name + " 		: " + para.value
			);
		});
		//   alert( decodedLogs[0].events[decodedLogs[0].events.length-1].name + ":" + decodedLogs[0].events[decodedLogs[0].events.length-1].value);
	}
	return output;
}

var executeQuery = function(res, query, output) {
	sql.connect(dbConfig, function(err) {
		if (err) {
			console.log("Error while connecting database :- " + err);
			sql.close();

			res.end(JSON.stringify(err));
		} else {
			// create Request object
			var request = new sql.Request();
			// query to the database
			request.query(query, function(err, ress) {
				if (err) {
					console.log("Error while querying database :- " + err);
					sql.close();

					res.end(JSON.stringify(err));
				} else {
					sql.close();
					console.log(ress);
					res.end(JSON.stringify(output));
				}
			});
		}
	});
}


function twoDigits(d) {
	if (0 <= d && d < 10) return "0" + d.toString();
	if (-10 < d && d < 0) return "-0" + (-1 * d).toString();
	return d.toString();
}

/**
 * …and then create the method to output the date string as desired.
 * Some people hate using prototypes this way, but if you are going
 * to apply this to more than one Date object, having it as a prototype
 * makes sense.
 **/
Date.prototype.toMysqlFormat = function() {
	return this.getUTCFullYear() + "-" + twoDigits(1 + this.getUTCMonth()) + "-" + twoDigits(this.getUTCDate());
};


// function getData(userAddress) {
// 	creditscore.getID(userAddress, {
// 		from: userAddress
// 	}, function(err, result) {
// 		console.log(result);
// 		return result;
// 	});
// }
// function createaccount() {
// 	var pvtKey = crypto.randomBytes(32).toString('hex')
// 	request({
// 	 uri: "http://13.82.91.127:8102/",
// 	 method: "POST",
// 	 json:true,
// 	 body: {
// 	   jsonrpc: "2.0",
// 	   method: "personal_importRawKey",
// 	   params:[pvtKey,"01"],
// 	   id: 15
// 	 }
// 	},function(error,response,body){
// 	 console.log('error:', error);
// 	 console.log('statusCode:', response && response.statusCode);
// 	 console.log('body:', body); 
// 	 return body.result;
// 	});
// }

var server = app.listen(8201, function() {
	var host = server.address().address
	var port = server.address().port

	console.log("Example app listening at http://%s:%s", host, port)
})
