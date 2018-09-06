var express = require('express');
var bodyParser = require('body-parser');
var sql = require("mssql");
var app = express();
var fs = require("fs");
var Web3 = require('web3');
var request = require('request');
var crypto = require('crypto');
const IPFS = require('ipfs-mini');
const abiDecoder = require('abi-decoder');
var CryptoJS = require("crypto-js");
let web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider('http://13.82.91.127:8102'));

const ipfs = new IPFS({ host: 'localhost', port: 5001, protocol: 'http' });
// const ipfs = new IPFS({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });

console.log(ipfs);
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

fs.readFile(__dirname + "/" + "icreditscoreabi.json", 'utf8', function(err, data) {
	// console.log(typeof(data))
	creditscoreContract = web3.eth.contract(JSON.parse(data));
	creditscore = creditscoreContract.at('0xb9c835a196b8a4205a589ee9b951f5a9747ee830');

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
		console.log("BankNew: "+bankaccountaddress);
		var output = {};
		var ipfsOutput = {};
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
				if (txReceipt.logs.length > 0)
				{
					const decodedLogs = abiDecoder.decodeLogs(txReceipt.logs);
					 var _bankID = decodedLogs[0].events[0].value;
					console.log(decodedLogs[0].name);
					console.log(_bankID);

					if (decodedLogs[0].name === "BankAdded") {
						var IPFSHASH;
						ipfsOutput["TransactionID"] = result;
						ipfsOutput["BankID"] = _bankID;
						ipfsOutput["BankName"] = bankname;
						ipfsOutput["BankAccountAddress"] = bankaccountaddress;
						ipfsOutput["BankRegisteredAddress"] = bankregisteredaddress;
						/* Encrypting Data 

						var bufferArray = Buffer.from(JSON.stringify(ipfsOutput));
						console.log(bufferArray);
						var ipfsEncOutput = CryptoJS.AES.encrypt(JSON.stringify(ipfsOutput),"testIPFS").toString();
						console.log(ipfsEncOutput);

						*/ 
						ipfs.add(JSON.stringify(ipfsOutput),(err,rst)=>{
							console.log(rst);
							IPFSHASH = rst;
						
						creditscore.addIPFSHash(1,IPFSHASH,_bankID, {gas: 500000}, function(err, result) 
						{
							if (err) {
								console.log(err);
								res.end(JSON.stringify(err));
							}
						});
						var query = "INSERT INTO BANK (BANKID,BANKACCOUNTADDRESS,BANKNAME,CITY,IPFSHASH) VALUES ('" + _bankID + "','"  + bankaccountaddress + "','" + bankname + "','" + bankregisteredaddress + "','"+IPFSHASH+"');"
						console.log(query);
						executeQuery(res, query, output);
						})

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
		var ipfsOutput = {};
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
						var IPFSHASH;
						ipfsOutput["TransactionID"] = result;
						ipfsOutput["CollectionAgencyID"] = _collectionAgency;
						ipfsOutput["CollectionAgencyName"] = collectionagencyname;
						ipfsOutput["CollectionAgencyAccountAddress"] = collectionAgencyAccountAddress;

						ipfs.add(JSON.stringify(ipfsOutput),(err,rst)=>{
							console.log(rst);
							IPFSHASH = rst;
						creditscore.addIPFSHash(2,IPFSHASH,_bankID, {gas: 500000}, function(err, result) 
						{
							if (err) {
								console.log(err);
							res.end(JSON.stringify(err));
							}
						});
						var query = "INSERT INTO COLLECTIONAGENCY VALUES ('" + _collectionAgency + "','" + collectionagencyname + "','" + collectionAgencyAccountAddress + "','"+IPFSHASH+"')";

						executeQuery(res, query, output);
						})
						// ipfsOutput["TransactionID"] = result;
						// ipfsOutput["CollectionAgencyID"] = _collectionAgency;
						// ipfsOutput["CollectionAgencyName"] = collectionagencyname;
						// ipfsOutput["CollectionAgencyAccountAddress"] = collectionAgencyAccountAddress;

						// ipfs.add(JSON.stringify(ipfsOutput),(err,rst)=>{
						// 	console.log(rst);
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
		var ipfsOutput = {};
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
						var IPFSHASH;
						ipfsOutput["TransactionID"] = result;
						ipfsOutput["CompanyID"] = CUID;
						ipfsOutput["CompanyAddress"] = companyName;
						ipfsOutput["CompanyRegisterAddress"] = registeredAddress;
						ipfsOutput["CompanyAccountAddress"] = companyAccountAddress;

						ipfs.add(JSON.stringify(ipfsOutput),(err,rst)=>{
							console.log(rst);
							IPFSHASH = rst;

						creditscore.addIPFSHash(0,IPFSHASH,CUID, {gas: 500000}, function(err, result) 
						{
							if (err) {
								console.log(err);
								res.end(JSON.stringify(err));
							}
						});

						var query = "INSERT INTO COMPANY VALUES ('" + CUID + "','" + companyName + "','" + registeredAddress + "','" + companyAccountAddress + "','"+IPFSHASH+"')";
						
						executeQuery(res, query, output);
						})
						// ipfsOutput["TransactionID"] = result;
						// ipfsOutput["CompanyID"] = CUID;
						// ipfsOutput["CompanyAddress"] = companyName;
						// ipfsOutput["CompanyRegisterAddress"] = registeredAddress;
						// ipfsOutput["CompanyAccountAddress"] = companyAccountAddress;

						// ipfs.add(JSON.stringify(ipfsOutput),(err,rst)=>{
						// 	console.log(rst);
						// }) 
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
		// console.log("test");
	var bankAccountAddress = req.body.address,
		companyID = req.body.companyid,
		bankAccountNumber = req.body.bankano,
		amountDue = req.body.amountdue,
		accType = req.body.accounttype,
		date = new Date(Date.now()).toMysqlFormat();
	var lenderID="";
		// console.log("test");
	var output = {};
	var ipfsOutput = {};
	// var test = 1536486;
	var IPFSHash = null;
	// var _lenderID; 
	
	ipfsOutput["CompanyID"] = companyID;
	ipfsOutput["BankAddress"] = bankAccountAddress;
	ipfsOutput["bankAccountNumber"] = bankAccountNumber;
	ipfsOutput["amountDue"] = amountDue;
	ipfsOutput["Account_Type"] = accType;
	ipfsOutput["Date"] = date;

	
	creditscore.getID({from: bankAccountAddress,gas: 500000}, function(err, result)
	{
		if (err) {
			console.log(err);
			res.end(JSON.stringify(err));
		}
		console.log(result);
		lenderID = result;
		console.log(lenderID);
		ipfsOutput["LenderID"] = lenderID;
	// });

	creditscore.generateSeed(lenderID,companyID,bankAccountNumber,"0x0", {from: bankAccountAddress,gas: 500000}, function(err, result) 
	{
		if (err) {
			console.log(err);
			res.end(JSON.stringify(err));
		}
		console.log("Seed generated "+result);
		printTransaction(result);
		// readLogs(result);
	// });

	creditscore.getSeed(bankAccountNumber, {from: bankAccountAddress,gas: 500000}, function(err, result) 
	{
		if (err) {
			console.log(err);
			res.end(JSON.stringify(err));
		}
		console.log("seed: "+result);
		var seedData = result;
	
// ADD encrypotion
	// var bufferArray = Buffer.from(JSON.stringify(ipfsOutput));
	// console.log(bufferArray);
	var ipfsEncOutput = CryptoJS.AES.encrypt(JSON.stringify(ipfsOutput),seedData).toString();
	console.log(ipfsEncOutput);

	
	ipfs.add(ipfsEncOutput,(err,rst)=>{
		console.log(rst);
		IPFSHash = rst;
	// }) 
	// ipfs.cat(IPFSHash,(err,rstt)=>{
	// 	var bytes  = CryptoJS.AES.decrypt(rstt, seedData);
	// 	var plaintext = bytes.toString(CryptoJS.enc.Utf8);
	
	
	creditscore.initiateNewIPFSB2C(companyID,bankAccountNumber, IPFSHash,{
		from: bankAccountAddress,
		gas: 500000
	}, function(err, result) 
	{
		if (err) 
		{
			console.log(err);
			res.end(JSON.stringify(err));
		}
		console.log("test");
		console.log(result);
		output["TransactionID"] = result;
		output['accountAddredd'] = req.body.address;
		console.log("test");
		if (result) 
		{
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
			if (txReceipt.logs.length > 0) 
			{
				const decodedLogs = abiDecoder.decodeLogs(txReceipt.logs);
				console.log(decodedLogs[0].name);
				console.log("test");

				if (decodedLogs[0].name === "newIPFSCreditTransactionBanktoCompany") 
				{
					var currentDate = new Date(Date.now()).toMysqlFormat();
					console.log(currentDate);
					var query = "INSERT INTO TRANSACTIONB2C (TRANSACTIONID,COMPANYID,IPFSHASH) VALUES ('" + result + "','" + companyID + "','" + IPFSHash + "')";
					console.log(query);
					executeQuery(res, query, output);

				} 
				else 
				{
					res.end(JSON.stringify(output));
					console.log("Error in Transaction");
				}
			} 
			else 
			{
				res.end(JSON.stringify(output));
				console.log("Account Already Issued.");
			}
		}
		res.end(JSON.stringify(output));
	});

	console.log(rst);
	// console.log(rstt);
	// console.log(bytes);
	// console.log(plaintext);
	});
});
});
});
});
// });

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
	var ipfsOutput = {};
	var IPFSHash = null;

	ipfsOutput["CompanyID"] = companyID;
	ipfsOutput["BankAccountAddress"] = bankAccountAddress;
	ipfsOutput["BankAccountNumber"] = bankAccountNumber;
	ipfsOutput["InstallmentAmount"] = installmentAmount;
	ipfsOutput["DueDate"] = duedate;
	ipfsOutput["DaysInArrear"] = daysinarrear;
	ipfsOutput["PaymentDate"] = paymentDate;
	ipfsOutput["AccountBalance"] = accountbalance;

	
	creditscore.getSeed(bankAccountNumber, {from: bankAccountAddress,gas: 500000}, function(err, result) 
	{
		if (err) {
			console.log(err);
			res.end(JSON.stringify(err));
		}
		console.log("seed: "+result);
		var seedData = result;


		var ipfsEncOutput = CryptoJS.AES.encrypt(JSON.stringify(ipfsOutput),seedData).toString();
		console.log(ipfsEncOutput);

		ipfs.add(ipfsEncOutput,(err,rst)=>{
			console.log(rst);
			IPFSHash = rst;

			creditscore.addIPFSCompanyToBankTx(companyID,bankAccountNumber, IPFSHash, {
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

						if (decodedLogs[0].name === "newIPFSDebitTransactionBanktoCompany") {
							// paymentdate = (new Date(paymentDate * 1000)).toMysqlFormat();
							// console.log(paymentdate);
							var query = "INSERT INTO TRANSACTIONB2C (TRANSACTIONID,COMPANYID,IPFSHASH) VALUES ('" + result + "','" + companyID + "','" + IPFSHash + "')"
							console.log(query)
							executeQuery(res, query, output);
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

app.post('/delayonpayment', function(req, res) 
{
	var Owneraddress = req.body.address,
		_companyID = req.body.companyid,
		_bankAccountNumber = req.body.bankano,
		_installmentAmount = req.body.installmentamount,
		_dueDate = req.body.duedate,
		_delayDays = req.body.delaydays;
	var output = {};

	var ipfsOutput = {};
	var IPFSHash = null;
	// var _lenderID; 
	
	ipfsOutput["CompanyID"] = _companyID;
	ipfsOutput["BankAccountNumber"] = _bankAccountNumber;
	ipfsOutput["InstallmentAmount"] = _installmentAmount;
	ipfsOutput["DueDate"] = _dueDate;
	ipfsOutput["DelayDays"] = _delayDays;

	creditscore.getID({from: Owneraddress,gas: 500000}, function(err, result)
	{
		if (err) {
			console.log(err);
			res.end(JSON.stringify(err));
		}
		console.log(result);
		CollAgID = result;
		ipfsOutput["CollectionAgID"] = CollAgID;

		creditscore.generateSeed("0x0",_companyID,_bankAccountNumber,CollAgID, {from: Owneraddress,gas: 500000}, function(err, result) 
		{
			if (err) {
				console.log(err);
				res.end(JSON.stringify(err));
			}
			console.log("Seed generated "+result);
			printTransaction(result);
	

			creditscore.getSeed(_bankAccountNumber, {from: Owneraddress,gas: 500000}, function(err, result) 
			{
				if (err) {
					console.log(err);
					res.end(JSON.stringify(err));
				}
				console.log("seed: "+result);
				var seedData = result;
	
				var ipfsEncOutput = CryptoJS.AES.encrypt(JSON.stringify(ipfsOutput),seedData).toString();
				console.log(ipfsEncOutput);

	
				ipfs.add(ipfsEncOutput,(err,rst)=>{
					console.log(rst);
					IPFSHash = rst;

					creditscore.delayOnPaymentC2B(_companyID, _bankAccountNumber, IPFSHash, {
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
							var query = "INSERT INTO TRANSACTIONB2C (TRANSACTIONID,COMPANYID,IPFSHASH) VALUES ('" + result + "','" + _companyID + "','" + IPFSHash + ")";
							// var query = "INSERT INTO TRANSACTIONB2C ('" + result + "','" + companyID + "','" + bankID + "','" + bankAccountNumber + "'," + installmentAmount + "," + (new Date(duedate * 1000)).toMysqlFormat() + "," + (new Date(paymentDate * 1000)).toMysqlFormat() + "," + (daysinarrear - duedate) / 84200 + ",2," + accountbalance + ")";
							console.log(query)
							executeQuery(res, query, output);
						}
						res.end(JSON.stringify(output));
						console.log(output);
					});
				});
			});
		});
	});
});

app.post('/updateArrearTime', function(req, res) 
{
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
	var ipfsOutput = {};
	var IPFSHash = null;
	// var _lenderID; 
	
	ipfsOutput["LenderID"] = _lenderID;
	ipfsOutput["CompanyID"] = _companyID;
	ipfsOutput["ContractORBankAccountNumber"] = _contractIDOrbankAccountNumber;
	ipfsOutput["ArrearDays"] = arrearDays;
	ipfsOutput["PaymentDueDate"] = payment_due_date;
	ipfsOutput["PaymentDueAmmount"] = payment_due_amount;
	ipfsOutput["DelayReason"] = _delayReason;

	creditscore.getID({from: Owneraddress,gas: 500000}, function(err, result)
	{
		if (err) {
			console.log(err);
			res.end(JSON.stringify(err));
		}
		console.log(result);
		collAgID = result;
		ipfsOutput["CollectionAgency"] = collAgID;

		creditscore.generateSeed("0x0",_companyID,_contractIDOrbankAccountNumber,collAgID, {from: Owneraddress,gas: 500000}, function(err, result) 
		{
			if (err) {
				console.log(err);
				res.end(JSON.stringify(err));
			}
			console.log("Seed generated "+result);
			printTransaction(result);
			// readLogs(result);
			// });

			creditscore.getSeed(_contractIDOrbankAccountNumber, {from: Owneraddress,gas: 500000}, function(err, result) 
			{
				if (err) {
					console.log(err);
					res.end(JSON.stringify(err));
				}
				console.log("seed: "+result);
				var seedData = result;


				var ipfsEncOutput = CryptoJS.AES.encrypt(JSON.stringify(ipfsOutput),seedData).toString();
				console.log(ipfsEncOutput);

				
				ipfs.add(ipfsEncOutput,(err,rst)=>{
					console.log(rst);
					IPFSHash = rst;
					// }) 

					creditscore.updateArrearTime(_companyID,_contractIDOrbankAccountNumber,IPFSHash, {
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
						
						console.log(output);

						res.end(JSON.stringify(output));
					});
				});
			});
		});
	});
});

app.post('/initiateC2CTxn', function(req, res) {
	// web3.eth.defaultAccount = compnayAA;
	// console.log(creditscore);
	var companyAccountAddress = req.body.address,
		companyID = req.body.company1id,
		contractID = req.body.contractid;
	var lenderID="";
	var output = {};
	var date = new Date(Date.now()).toMysqlFormat();
	// console.log(req.body);
	var ipfsOutput = {};
	var IPFSHash = null;
	
	ipfsOutput["Company2ID"] = companyID;
	ipfsOutput["Company1Address"] = companyAccountAddress;
	ipfsOutput["ContractID"] = contractID;
	ipfsOutput["Date"] = date;

	creditscore.getID({from: companyAccountAddress,gas: 500000}, function(err, result)
	{
		if (err) {
			console.log(err);
			res.end(JSON.stringify(err));
		}
		console.log(result);
		lenderID = result;
		ipfsOutput["LenderID"] = lenderID;

		creditscore.generateSeed(lenderID,companyID,contractID,"0x0", {from: companyAccountAddress,gas: 500000}, function(err, result) 
		{
			if (err) {
				console.log(err);
				res.end(JSON.stringify(err));
			}
			console.log("Seed generated "+result);
			printTransaction(result);

			creditscore.getSeed(contractID, {from: companyAccountAddress,gas: 500000}, function(err, result) 
			{
				if (err) {
					console.log(err);
					res.end(JSON.stringify(err));
				}
				console.log("seed: "+result);
				var seedData = result;

	
				var ipfsEncOutput = CryptoJS.AES.encrypt(JSON.stringify(ipfsOutput),seedData).toString();
				console.log(ipfsEncOutput);

				ipfs.add(ipfsEncOutput,(err,rst)=>{
					console.log(rst);
					IPFSHash = rst;

					creditscore.initiateNewIPFSC2C(companyID,contractID, IPFSHash, {
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

								if (decodedLogs[0].name === "newIPFSCreditTransactionCompanytoCompany") {
									var query = "INSERT INTO TRANSACTIONC2C (TRANSACTIONID,COMPANY2ID,IPFSHASH) VALUES ('" + result + "','" + companyID + "','" + IPFSHash + "')"
									
									console.log(query)
									executeQuery(res, query, output);
									
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
			});
		});
	});
});

app.post('/AddC2CTxn', function(req, res) 
{
	var companyAccountAddress = req.body.address,
		companyID = req.body.company1id,
		contractID = req.body.contractid,
		invoiceNumber = req.body.invoiceno,
		installmentAmount = req.body.iamount,
		duedate = req.body.duedate,
		paymentDate = 1502320505,
		daysinarrear = req.body.daysinarrear,
		outstandingBalance = req.body.obalance;

	// console.log(contractID);
	var output = {};
	var ipfsOutput = {};
	var IPFSHash = null;
	
	ipfsOutput["Company2ID"] = companyID;
	ipfsOutput["Company1Address"] = companyAccountAddress;
	ipfsOutput["ContractID"] = contractID;
	ipfsOutput["invoiceNumber"] = invoiceNumber;
	ipfsOutput["installmentAmount"] = installmentAmount;
	ipfsOutput["duedate"] = duedate;
	ipfsOutput["paymentDate"] = paymentDate;
	ipfsOutput["daysinarrear"] = daysinarrear;
	ipfsOutput["outstandingBalance"] = outstandingBalance;

	
	creditscore.getSeed(contractID, {from: companyAccountAddress,gas: 500000}, function(err, result) 
	{
		if (err) {
			console.log(err);
			res.end(JSON.stringify(err));
		}
		console.log("seed: "+result);
		var seedData = result;
	

		var ipfsEncOutput = CryptoJS.AES.encrypt(JSON.stringify(ipfsOutput),seedData).toString();
		console.log(ipfsEncOutput);
	
		ipfs.add(ipfsEncOutput,(err,rst)=>{
			console.log(rst);
			IPFSHash = rst;

			creditscore.addIPFSCompanyToBankTx(companyID,contractID, IPFSHash, {
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

						if (decodedLogs[0].name === "newIPFSDebitTransactionBanktoCompany") {
							var query = "INSERT INTO TRANSACTIONC2C (TRANSACTIONID,COMPANY2ID,IPFSHASH) VALUES ('" + result + "','" + companyID + "','" + IPFSHash + "')"
							console.log(query);
							executeQuery(res, query, output)
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
	var decryptedRst;
	
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
			} 
			else if (_between == 1) {
				for (var i = 0; i < count; i++) {
					// while (output[i] == null || i==count) {

					creditscore.retriveTransactionB2CIPFS(i, {
						from: address
					}, function(err, result) {
						
						// console.log(result);
						if (result) {
							ipfs.cat(result[1],(err,rst)=>{
								// var bytes  = CryptoJS.AES.decrypt(rstt, seedData);
			// 	var plaintext = bytes.toString(CryptoJS.enc.Utf8);
								output[f] = [];
								
							
							output[f].push({
								"BankID": result[0]
							});

							output[f].push({
								"BankAccountAddress": result[2]
							});
							// output[f].push({
							// 	"bankID": result[1]
							// });
							output[f].push({
								"Hash": result[1]
							});
								if(err){
									console.log(err);
								}	
								else{
									console.log(rst);
									output[f].push({
										"Output": JSON.parse(rst)
									});
								}
								
								
						console.log(output);
						f++;
						// console.log(flag);
						if (f == count) {
							res.end(JSON.stringify(output));

							// process.exit();
						}
							})
						
							// output[f].push({
							// 	"dueDate": result[4]
							// });
							// output[f].push({
							// 	"paymentDate": result[5]
							// });
							// f++;
						// })
						}

					});
					// }
				}
				// res.end(output);
				// res.end(JSON.stringify(output));
			} else if (_between == 0) {
				for (var i = 0; i < count; i++) {
					creditscore.retriveTransactionC2CIPFS(i, {
						from: address
					}, function(err, result) {
						
						// console.log(result);
						if (result) {
							ipfs.cat(result[1],(err,rst)=>{
								output[f] = [];

							// ipfs.cat(result[1],(err,rst)=>{
								
							// console.log(rst);
							
							output[f].push({
								"CompID": result[0]
							});
							// output[f].push({
							// 	"bankID": result[1]
							// });
							output[f].push({
								"Hash": result[1]
							});
								if(err){
									console.log(err);
								}	
								else{
									console.log(rst);
									output[f].push({
										"Output": JSON.parse(rst)
									});
								}
								
								
						console.log(output);
						f++;
						// console.log(flag);
						if (f == count) {
							res.end(JSON.stringify(output));

							// process.exit();
						}
							})
						
							// output[f].push({
							// 	"dueDate": result[4]
							// });
							// output[f].push({
							// 	"paymentDate": result[5]
							// });
							// f++;
						// })
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
	console.log(txReceipt);
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
