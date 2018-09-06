pragma solidity ^0.4.23;

/*
* @title Math Operation.
* @dev Perform basic math operation on uint256 for preventing arthmatic errors.
*/
library SafeMath {
    function safeAdd(uint a, uint b) internal pure returns (uint c) {
        c = a + b;
        require(c >= a);
        return c;
    }

    function safeSub(uint a, uint b) internal pure returns (uint c) {
        require(b <= a);
        c = a - b;
        return c;
    }

    function safeMul(uint a, uint b) internal pure returns (uint c) {
        c = a * b;
        require(a == 0 || c / a == b);
    }

    function safeDiv(uint a, uint b) internal pure returns (uint c) {
        require(b > 0);
        c = a / b;
    }
}

/*
* @title Owner Opration.
* @dev Check ownership details for performing owner's action and change owner.
*/
contract Owned {
    address public owner;
    address public newOwner;

    event OwnershipTransferred(address indexed _from, address indexed _to);

    constructor() public {
        owner = msg.sender;
    }

    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }

    /*
    * @dev Transfer Ownership
    * @param _newAddress Ethereum Address of new owner.
    */
    function transferOwnership(address _newOwner) public onlyOwner {
        newOwner = _newOwner;
    }

    /*
    * @dev Accept ownership request by new owner.
    */
    function acceptOwnership() public {
        require(msg.sender == newOwner);
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
        newOwner = address(0);
    }
}

/*
* @title Credit Score
*/
contract CreditScore is Owned {

    using SafeMath for uint256;

    struct encryptionSeed{
      bytes32 lenderID;
      bytes32 companyID;
      bytes32 collectionAgencyID;
      bytes32 bankAccountNumberORContractID;
      bytes32 randomSeed;
    }

    struct Bank{
        bytes32 bankID;
        address bankAccountAddress;
        string bankName;
        string Hash;
    }

    struct Company {
        bytes32 companyID;
        address companyAccountAddress;
        string companyName;
        uint256 creditScore;
        string Hash;
    }

    struct CollectionAgency{
        bytes32 collectionAgencyID;
        address collectionAgencyAccountAddress;
        string collectionAgencyName;
        string Hash;
    }

    struct TransactionIPFSC2C{
        bytes32 company1ID;
        bytes32 company2ID;
        string Hash;
    }

    struct TransactionIPFSB2C {
    bytes32 companyID;
    bytes32 bankID;
    string Hash;
    }

    struct TransactionIPFSCA2C {
    bytes32 companyID;
    bytes32 collectionAgencyID;
    string Hash;
    }


    mapping(bytes32 => Company) CompanyDetails; // Store Company details <CompanyID:CompanyDetails>
    mapping(bytes32 => CollectionAgency) CollectionAgencyDetails; //Store CollectionAgency details <CollectionAgencyID:CollectionAgencyDetails>
    mapping(bytes32 => Bank) BankDetails; //Store Bank details <BankID:BankDetails>

    mapping(bytes32 => encryptionSeed) Seeds;
    mapping(bytes32 => mapping(bytes32=>uint256)) Partners; //Store Company Bank No of Tx <CompanyID: <bankAccountNumber : TxCount>>
    mapping(bytes32 => mapping(bytes32=>uint256[2])) AccessDuration; //Store Company Credit Score access duration <CompanyID: <LenderID: Duration[StratTime,EndTime]>>

    mapping(address => bytes32) UserID; //Store Address associated Id <address: BankID/CompanyID>

    mapping(bytes32 => TransactionIPFSB2C[]) IPFSTransactionDetailsB2C;
    mapping(bytes32 => TransactionIPFSC2C[]) IPFSTransactionDetailsC2C;
    mapping(bytes32 => TransactionIPFSCA2C[]) IPFSCollectionAgencyTxOnDelay; //Store Tx Delay Reason <CompanyID: CollectionAgencyTx[]>

    event BankAlreadyExist(bytes32 BankID,string BankName);
    event BankAdded(bytes32 BankID,address BankAccountAddress,string BankName);
    event CompanyExist(bytes32 CompanyID, string CompanyName);
    event CompanyAdded(bytes32 CompanyID,address CompanyAccountAddress, string CompanyName);
    event CollectionAgencyExist(bytes32 CollectionAgencyID,string CollectionAgencyName);
    event CollectionAgencyAdded(bytes32 CollectionAgencyID,address CollectionAgencyAccountAddress,string CollectionAgencyName);

    event DelayReason(bytes32 CollectionAgencyID,bytes32 CompanyID,string IPFSHash);
    event DelayOnTxC2B(bytes32 BankID,bytes32 CompanyID,string IPFSHash);

    event newIPFSCreditTransactionBanktoCompany(bytes32,bytes32,string);
    event newIPFSDebitTransactionBanktoCompany(bytes32,bytes32,string);
    event newIPFSCreditTransactionCompanytoCompany(bytes32,bytes32,string);
    event newIPFSDebitTransactionCompanytoCompany(bytes32,bytes32,string);

    /* event newCreditTransactionBanktoCompany(bytes32 CompanyID,bytes32 BankAccountNumber,bytes32 BankID,AccountType AccType,uint256 AccountDue);
    event newDebitTransactionBanktoCompany(bytes32 CompanyID,bytes32 BankAccountNumber,bytes32 BankID,uint256 AccountBalance);
    event newContractCompanytoCompany(bytes32 Company1ID,bytes32 Company2ID,bytes32 ContractID);
    event newDebitTransactionCompanytoCompany(bytes32 Company1ID,bytes32 Company2ID,bytes32 ContractID); */
    event AccessGranted(bytes32 Company1ID,bytes32 Company2ID,uint256 StartDate,uint256 EndDate);


// ----------------------------------------------registerBank------------------------------------------------------

/*
 * @dev: Register Bank
 * @param address _bankAccountAddress : Bank Ethereum account address
 * @param string _bankName : Bank name
 * @return : BankID, Generated using Bank name & Bank account address
 */
    function registerBank(address _bankAccountAddress,string _bankName) onlyOwner public returns(bytes32) {
        bytes32 _bankID = keccak256(abi.encode(_bankAccountAddress,_bankName));
        if(BankDetails[_bankID].bankID == _bankID)
        {
            emit BankAlreadyExist(BankDetails[_bankID].bankID,BankDetails[_bankID].bankName);
            return _bankID;
        }
        else{
            Bank memory newBank;
            newBank.bankID = _bankID;
            newBank.bankAccountAddress = _bankAccountAddress;
            newBank.bankName = _bankName;
            BankDetails[_bankID] = newBank;
            UserID[_bankAccountAddress]=_bankID;
            emit BankAdded(_bankID,_bankAccountAddress,_bankName);
            return _bankID;
        }
    }

// -----------------------------------------registerCompany-----------------------------------------------------------------------

/*
 * @dev: Register Company
 * @param address _companyAccountAddress : Company Ethereum account address
 * @param string _companyName : Company register name
 * @return : CompanyID
 */
    function registerCompany(address _companyAccountAddress,string _companyName) onlyOwner public returns(bytes32) {
        /* address _companyID = msg.sender; */
        bytes32 _companyID = keccak256(abi.encode(_companyAccountAddress,_companyName));
        if(CompanyDetails[_companyID].companyID == _companyID)
        {
            emit CompanyExist(CompanyDetails[_companyID].companyID,CompanyDetails[_companyID].companyName);
            return _companyID;
        }
        else{
        Company memory newCompany;
        newCompany.companyName = _companyName;
        newCompany.companyID = _companyID;
        newCompany.companyAccountAddress = _companyAccountAddress;
        newCompany.creditScore = 100;
        CompanyDetails[_companyID] = newCompany;
        UserID[_companyAccountAddress] = _companyID;
        emit CompanyAdded(_companyID,_companyAccountAddress,_companyName);
        return _companyID;
        }
    }
// --------------------------------------------------registerCollectionAgency-----------------------------------------------------------


/*
 * @dev: Register CollectionAgency
 * @param string _collectionAgencyName : CollectionAgency Ethereum account address
 * @param address _collectionAgencyAccountAddress : CollectionAgency name
 * @return : CollectionAgencyID
 */
    function registerCollectionAgency(string _collectionAgencyName,address _collectionAgencyAccountAddress) onlyOwner public returns (bytes32){
        bytes32 _collectionAgencyID = keccak256(abi.encode(_collectionAgencyName,_collectionAgencyAccountAddress));
        if(CollectionAgencyDetails[_collectionAgencyID].collectionAgencyID != "")
        {
            emit CollectionAgencyExist(CollectionAgencyDetails[_collectionAgencyID].collectionAgencyID,CollectionAgencyDetails[_collectionAgencyID].collectionAgencyName);
            return _collectionAgencyID;
        }
        else
        {
            CollectionAgency memory newCollectionAgency;
            newCollectionAgency.collectionAgencyID = _collectionAgencyID;
            newCollectionAgency.collectionAgencyAccountAddress = _collectionAgencyAccountAddress;
            newCollectionAgency.collectionAgencyName = _collectionAgencyName;
            CollectionAgencyDetails[_collectionAgencyID] = newCollectionAgency;
            UserID[_collectionAgencyAccountAddress] = _collectionAgencyID;
            emit CollectionAgencyAdded(_collectionAgencyID,_collectionAgencyAccountAddress,_collectionAgencyName);
            return _collectionAgencyID;
        }
    }

    // --------------------------------------------------------Transaction-----------------------------------------------------------
function addIPFSHash(uint256 index,string Hash,bytes32 ID) onlyOwner public returns (bool)
{
  if(index==0 && CompanyDetails[ID].companyID!=""){
    CompanyDetails[ID].Hash = Hash;
    return true;
  }else if(index==1 && BankDetails[ID].bankID!=""){
    BankDetails[ID].Hash = Hash;
    return true;
  } else if(index==2 && CollectionAgencyDetails[ID].collectionAgencyID!="" ){
    CollectionAgencyDetails[ID].Hash = Hash;
    return true;
  }else{
    return false;
  }
}


function generateSeed(bytes32 _lenderID,bytes32 _companyID, bytes32 _bankAccountNumberORContractID,bytes32 _collectionAgencyID) public returns(bool isSeedAdded) {
  if(UserID[msg.sender]==_lenderID || UserID[msg.sender]==_collectionAgencyID){
    return false;
  }
  require(CompanyDetails[_companyID].companyID!="");
  require(Seeds[_bankAccountNumberORContractID].companyID=="");
  bytes32 _randomSeed = keccak256(abi.encode(_lenderID,_companyID,_bankAccountNumberORContractID,_collectionAgencyID));
  encryptionSeed memory newEncryptionSeed;
  newEncryptionSeed.lenderID = _lenderID;
  newEncryptionSeed.companyID = _companyID;
  newEncryptionSeed.bankAccountNumberORContractID = _bankAccountNumberORContractID;
  newEncryptionSeed.collectionAgencyID = _collectionAgencyID;
  newEncryptionSeed.randomSeed = _randomSeed;
  Seeds[_bankAccountNumberORContractID] = newEncryptionSeed;
  return true;
}

function getSeed(bytes32 _bankAccountNumberORContractID) public constant returns(bytes32 seed){
  require(UserID[msg.sender]==Seeds[_bankAccountNumberORContractID].lenderID || UserID[msg.sender]==Seeds[_bankAccountNumberORContractID].companyID || UserID[msg.sender]==Seeds[_bankAccountNumberORContractID].collectionAgencyID);
  return(Seeds[_bankAccountNumberORContractID].randomSeed);
}

// Initiate B2C IPFs
// "0xae09960ef6b07f0ed6781df3511a47f20684cdf759abaf9d98bbfc5dacedf13b"
function initiateNewIPFSB2C(bytes32 _companyID,bytes32 _bankAccountNumber, string Hash)  public returns (bool _initiate)
{
    require(CompanyDetails[_companyID].companyID!="");
    require(UserID[msg.sender]==Seeds[_bankAccountNumber].lenderID);
    bytes32 _bankID = UserID[msg.sender];
    TransactionIPFSB2C memory newIPFSTransaction;
    newIPFSTransaction.companyID = _companyID;
    newIPFSTransaction.bankID = _bankID;
    newIPFSTransaction.Hash = Hash;
    IPFSTransactionDetailsB2C[_companyID].push(newIPFSTransaction);
Partners[_companyID][_bankID]= Partners[_companyID][_bankID].safeAdd(1);
    emit newIPFSCreditTransactionBanktoCompany(_bankID,_companyID,Hash);
    return true;

}

function addIPFSCompanyToBankTx(bytes32 _companyID,bytes32 _bankAccountNumber,string Hash) public returns (bool _isTx)
{
    require(CompanyDetails[_companyID].companyID!="");
    require(UserID[msg.sender]==Seeds[_bankAccountNumber].lenderID);
    bytes32 _bankID = UserID[msg.sender];
    TransactionIPFSB2C memory newIPFSTransaction;
    newIPFSTransaction.companyID =_companyID;
    newIPFSTransaction.bankID = _bankID;
    newIPFSTransaction.Hash = Hash;
    IPFSTransactionDetailsB2C[_companyID].push(newIPFSTransaction);
    Partners[_companyID][_bankID]= Partners[_companyID][_bankID].safeAdd(1);

    emit newIPFSDebitTransactionBanktoCompany(_companyID,_bankID,Hash);
    return true;
}

/*
 * @dev: Intiate new Contract Between Company to Company
 * @param bytes32 _company2ID : Company ID who want services of other provider company.
 * @param bytes32 _contractID : Contract ID
 * @param uint256 _openDate : Contract Open date
 * @return : bool : contract added or not
 */
function initiateNewIPFSC2C(bytes32 _company2ID, bytes32 _contractID, string Hash)  public returns (bool _initiate)
{
    require(CompanyDetails[_company2ID].companyID!="");
    require(UserID[msg.sender]==Seeds[_contractID].lenderID);
    bytes32 _company1ID = UserID[msg.sender];
    TransactionIPFSC2C memory newIPFSTransaction;
    newIPFSTransaction.company1ID = _company1ID;
    newIPFSTransaction.company2ID = _company2ID;
    newIPFSTransaction.Hash = Hash;
    IPFSTransactionDetailsC2C[_company1ID].push(newIPFSTransaction);

    emit newIPFSCreditTransactionCompanytoCompany(_company1ID,_company2ID,Hash);
    return true;

}

function addIPFSCompanyToCompanyTx(bytes32 _company2ID,bytes32 _contractID,string Hash) public returns (bool _isTx)
{
    require(CompanyDetails[_company2ID].companyID!="");
    require(UserID[msg.sender]==Seeds[_contractID].lenderID);
    bytes32 _company1ID = UserID[msg.sender];
    TransactionIPFSC2C memory newIPFSTransaction;
    newIPFSTransaction.company1ID = _company1ID;
    newIPFSTransaction.company2ID = _company2ID;
    newIPFSTransaction.Hash = Hash;
    IPFSTransactionDetailsC2C[_company1ID].push(newIPFSTransaction);

    emit newIPFSDebitTransactionCompanytoCompany(_company1ID,_company2ID,Hash);
    return true;
}

/*
 * @dev: call by Collection agency on delay on payment (-ive Tx)
 * @param bytes32 _lenderID : lender id ( bank ID or company ID)
 * @param bytes32 _companyID : borrower ID
 * @param bytes32 _contractIDOrbankAccountNumber : Bank account number or Contract ID
 * @param uint256 _arrearDays : days in arrear
 * @param uint256 _dueDate : Due date of installment
 * @param uint256 _amount : installment amount
 * @param string _delayReason : Delay reason
 */
    function updateArrearTime(bytes32 _companyID,bytes32 _contractIDOrbankAccountNumber,string _hash) public{
          require(UserID[msg.sender]==Seeds[_contractIDOrbankAccountNumber].collectionAgencyID);
          bytes32 _collectionAgencyID = UserID[msg.sender];
          /* require(CollectionAgencyDetails[_collectionAgencyID].collectionAgencyAccountAddress == msg.sender); */
          /* require(CompanyDetails[_lenderID].companyID!='0x0' || BankDetails[_lenderID].bankID!='0X0'); */
          /* CompanyDetails[_companyID].creditScore = CompanyDetails[_companyID].creditScore.safeSub(1); */
          TransactionIPFSCA2C memory newTransactionIPFSCA2C;
            newTransactionIPFSCA2C.collectionAgencyID=_collectionAgencyID;
            newTransactionIPFSCA2C.companyID=_companyID;
            newTransactionIPFSCA2C.Hash=_hash;
            IPFSCollectionAgencyTxOnDelay[_companyID].push(newTransactionIPFSCA2C);
          emit DelayReason(_collectionAgencyID,_companyID,_hash);
    }

/*
 * @dev: Bank will call on delay on payment (-ive Tx)
 * @param bytes32 _companyID : borrower ID
 * @param bytes32 _bankAccountNumber : Bank Account Number
 * @param uint256 _installmentAmount : Installment Amount
 * @param uint256 _dueDate : Installment due date
 * @param uint256 _delayDays : number of days delay
 */
    function delayOnPaymentC2B(bytes32 _companyID,bytes32 _bankAccountNumber,string _hash) public {
            require(UserID[msg.sender]==Seeds[_bankAccountNumber].lenderID);
            require(_companyID==Seeds[_bankAccountNumber].companyID);

            bytes32 _bankID = UserID[msg.sender];
            /* require(BankDetails[_bankID].bankAccountAddress == msg.sender); */
            TransactionIPFSB2C memory newIPFSTransaction;
            newIPFSTransaction.companyID = _companyID;
            newIPFSTransaction.bankID = _bankID;
            newIPFSTransaction.Hash = _hash;
            IPFSTransactionDetailsB2C[_companyID].push(newIPFSTransaction);
          emit DelayOnTxC2B(_bankID,_companyID,_hash);
    }


 // * @dev: This function for credit score calculator for updating credit score by credit score engine.
 // * @param bytes32 _companyID : company ID
 // * @param uint256 _creditScore : new credit Score
 // * @return : bool : update

     function updateCreditScore(bytes32 _companyID,uint256 _creditScore) onlyOwner public returns(bool){
          CompanyDetails[_companyID].creditScore = _creditScore;
          return true;
    }


/*
 * @dev: Give access to other company or bank to see credit score.
 * @param bytes32 _company2ID : lender/ veiwer id
 * @param uint256 _startDate : start date for access credit score
 * @param uint256 _endDate : end date for access credit score
 * @return : bool : access granted
 */
    function giveAccessToCompany(bytes32 _company2ID,uint256 _startDate,uint256 _endDate) public returns(bool) {
        bytes32 _company1ID = UserID[msg.sender];
        require(CompanyDetails[_company1ID].companyAccountAddress == msg.sender);
        AccessDuration[_company1ID][_company2ID][0] = _startDate;
        AccessDuration[_company1ID][_company2ID][1] = _endDate;
        emit AccessGranted(_company1ID,_company2ID,_startDate,_endDate);
        return true;
    }

/*
 * @dev: check credit score of company.
 * @param bytes32 _companyID : company id
 * @return : credit score
 */
    function checkCreditScoreOFCompany(bytes32 _companyID) public constant returns(uint256) {
        bytes32 _requester = UserID[msg.sender];
        require(BankDetails[_requester].bankAccountAddress == msg.sender || CompanyDetails[_requester].companyAccountAddress==msg.sender || owner==msg.sender);
        if(Partners[_companyID][_requester]>0 || AccessDuration[_companyID][_requester][0]<=block.timestamp && AccessDuration[_companyID][_requester][1]>=block.timestamp){
            return (CompanyDetails[_companyID].creditScore);
        }else{
            return 0;
        }
    }

/*
 * @dev: company can check its details
 * @return : company details
 */
    function queryCompanyDetails() public constant returns(bytes32 ID,string name,uint256 creditScore) {
        bytes32 _companyID = UserID[msg.sender];
        require(CompanyDetails[_companyID].companyAccountAddress == msg.sender || owner==msg.sender);
        return (CompanyDetails[_companyID].companyID,CompanyDetails[_companyID].companyName,CompanyDetails[_companyID].creditScore);
    }

/*
 * @dev: check total tx between parties
 * @param uint8 _between : specify lender type(0=Comapny, 1=Bank, 2=CollectionAgency)
 * @return : totla number of tx
 */
    function totalTransaction(uint8 _between) public constant returns(uint256 count) {
        bytes32 _companyID = UserID[msg.sender];
        require(CompanyDetails[_companyID].companyAccountAddress == msg.sender || owner==msg.sender );
        if(_between==0){
            return IPFSTransactionDetailsC2C[_companyID].length;
        }
        else if(_between==1){
            return IPFSTransactionDetailsB2C[_companyID].length;
        }
        else if(_between==2){
            return IPFSCollectionAgencyTxOnDelay[_companyID].length;
        }
    }



function retriveTransactionB2CIPFS(uint256 _index) public constant returns (bytes32 lenderID, string Hash)
{
  bytes32 _companyID = UserID[msg.sender];

  require(CompanyDetails[_companyID].companyAccountAddress==msg.sender || owner==msg.sender );
    return (IPFSTransactionDetailsB2C[_companyID][_index].bankID,IPFSTransactionDetailsB2C[_companyID][_index].Hash);
}
/*
 * @dev: retirve tx between company to company
 * @param uint256 _index : tx index
 * @return : tx details
 */
    function retriveTransactionC2CIPFS(uint256 _index) public constant returns(bytes32 lenderID,string Hash){
      bytes32 _companyID = UserID[msg.sender];

      require(CompanyDetails[_companyID].companyAccountAddress==msg.sender || owner==msg.sender );

        return(IPFSTransactionDetailsC2C[_companyID][_index].company2ID,IPFSTransactionDetailsC2C[_companyID][_index].Hash);
    }

/*
 * @dev: retirve tx by collecton agency on delay in payment
 * @param uint256 _index : tx index
 * @return : tx details
 */
    function retriveCollectionAgencyTxOnDelay(uint256 _index) public constant returns(bytes32 CollectionAgencyID,string Hash){
      bytes32 _companyID = UserID[msg.sender];

      require(CompanyDetails[_companyID].companyAccountAddress==msg.sender || owner==msg.sender );
        return(IPFSCollectionAgencyTxOnDelay[_companyID][_index].collectionAgencyID,IPFSCollectionAgencyTxOnDelay[_companyID][_index].Hash);
    }
}