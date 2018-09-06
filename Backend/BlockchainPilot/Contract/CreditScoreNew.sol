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

    enum TransactionType {NoTx,Credit,Debit}
    enum AccountType {Loan,CreditCardPayment,Mortgage}

    struct Bank{
        bytes32 bankID;
        address bankAccountAddress;
        string bankName;
    }

    struct Company {
        bytes32 companyID;
        address companyAccountAddress;
        string companyName;
        uint256 creditScore;
    }

    struct CollectionAgency{
        bytes32 collectionAgencyID;
        address collectionAgencyAccountAddress;
        string collectionAgencyName;
    }
    struct TransactionB2C {
        bytes32 companyID;
        bytes32 bankID;
        bytes32 bankAccountNumber;
        uint256 openDate;
        uint256 installmentAmount;
        uint256 dueDate;
        uint256 paymentDate;
        uint256 daysinArrear;
        TransactionType txType;
        AccountType accType;
        /* uint256 extraArrearDays; */
        uint256 accountBalance;
    }

    struct TransactionC2C {
       bytes32 company1ID;
       bytes32 company2ID;
       bytes32 contractID;
       uint256 openDate;
       bytes32 invoiceNumber;
       uint256 installmentAmount;
       uint256 dueDate;
       uint256 daysinArrear;
       uint256 paymentDate;
       TransactionType txType;
       AccountType accType;
       /* uint256 extraArrearDays; */
       uint256 outstandingBalance;
    }

    struct CollectionAgencyTx {
        bytes32 collectionAgencyID;
        bytes32 lenderID;
        bytes32 companyID;
        bytes32 contractIDOrbankAccountNumber;
        uint256 arrearDays;
        uint256 dueDate;
        uint256 amount;
        string delayReason;
    }

    mapping(bytes32 => Company) CompanyDetails; // Store Company details <CompanyID:CompanyDetails>
    mapping(bytes32 => CollectionAgency) CollectionAgencyDetails; //Store CollectionAgency details <CollectionAgencyID:CollectionAgencyDetails>
    mapping(bytes32 => Bank) BankDetails; //Store Bank details <BankID:BankDetails>
    mapping(bytes32 => TransactionB2C[]) TransactionDetailsB2C; //Store Bank To Company Tx <CompanyID: TransactionB2C[]>
    mapping(bytes32 => TransactionC2C[]) TransactionDetailsC2C; //Store Company To Company Tx <CompanyID: TransactionC2C[]>
    mapping(bytes32 => CollectionAgencyTx[]) CollectionAgencyTxOnDelay; //Store Tx Delay Reason <CompanyID: CollectionAgencyTx[]>
    mapping(bytes32 => mapping(bytes32=>uint256)) partners; //Store Company Bank No of Tx <CompanyID: <bankAccountNumber : TxCount>>
    mapping(bytes32 => mapping(bytes32=>uint256)) CompanyLoaninstallmentAmount; //Store Company Bank Loan/CreditCardPayment/Mortgage Amount <CompanyID: <bankAccountNumber: Amount>>
    mapping(bytes32 => mapping(bytes32=>uint256)) CompanyContractTransaction; //Store Company to Company Contract Amount <CompanyID: <ContractID: Amount>>
    mapping(bytes32 => mapping(bytes32=>uint256[2])) AccessDuration; //Store Company Credit Score access duration <CompanyID: <LenderID: Duration[StratTime,EndTime]>>
    mapping(address => bytes32) UserID; //Store Address associated Id <address: BankID/CompanyID>

    event BankAlreadyExist(bytes32 BankID,string BankName);
    event BankAdded(bytes32 BankID,address BankAccountAddress,string BankName);
    event CompanyExist(bytes32 CompanyID, string CompanyName);
    event CompanyAdded(bytes32 CompanyID,address CompanyAccountAddress, string CompanyName);
    event CollectionAgencyExist(bytes32 CollectionAgencyID,string CollectionAgencyName);
    event CollectionAgencyAdded(bytes32 CollectionAgencyID,address CollectionAgencyAccountAddress,string CollectionAgencyName);
    event DelayReason(bytes32 CollectionAgencyID,bytes32 LenderID,bytes32 CompanyID,bytes32 contractIDOrbankAccountNumber,uint256 ExtraArrearDays,uint256 PaymentDueDate,uint256 Amount,string DelayReason);
    event DelayOnTxC2B(bytes32 BankID,bytes32 CompanyID,bytes32 BankAccountNumber,uint256 InstallmentAmount,uint256 DueDate,uint256 DelayDays);

    event newCreditTransactionBanktoCompany(bytes32 CompanyID,bytes32 BankAccountNumber,bytes32 BankID,AccountType AccType,uint256 AccountDue);
    event newDebitTransactionBanktoCompany(bytes32 CompanyID,bytes32 BankAccountNumber,bytes32 BankID,uint256 AccountBalance);
    event newContractCompanytoCompany(bytes32 Company1ID,bytes32 Company2ID,bytes32 ContractID);
    event newDebitTransactionCompanytoCompany(bytes32 Company1ID,bytes32 Company2ID,bytes32 ContractID);
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

/*
 * @dev: Initiate new Bank to Company TX. It can be Loan, Credit Card or Mortgage
 * @param bytes32 _companyID : Company Id who owe bank
 * @param bytes32 _bankAccountNumber : Company's bank account number
 * @param uint256 _amountDue : Initial amount balance bank give to company.
 * @param uint8 _accType : Specify Account Type [loan,credit card,Mortgage]=[0,1,2]
 * @param uint256 _openDate : Account open date.
 * @return : true when account added.
 */
    function initiateNewB2C(bytes32 _companyID, bytes32 _bankAccountNumber, uint256 _amountDue, uint8 _accType, uint256 _openDate)  public returns (bool _initiate) {
        require(CompanyDetails[_companyID].companyID!="");
        bytes32 _bankID = UserID[msg.sender];
        require(BankDetails[_bankID].bankAccountAddress == msg.sender);
        /* require() */
        if(CompanyLoaninstallmentAmount[_companyID][_bankAccountNumber]!=0)
        {
            return false;
        }
        else
        {
            TransactionB2C memory newTransaction;
            newTransaction.companyID =_companyID;
            newTransaction.bankID = _bankID;
            newTransaction.bankAccountNumber = _bankAccountNumber;
            newTransaction.openDate = _openDate;
            newTransaction.txType = TransactionType(1);
            newTransaction.accType = AccountType(_accType);
            TransactionDetailsB2C[_companyID].push(newTransaction);
            CompanyLoaninstallmentAmount[_companyID][_bankAccountNumber]=_amountDue;
            partners[_companyID][_bankID] = partners[_companyID][_bankID].safeAdd(1);
            emit newCreditTransactionBanktoCompany(_companyID,_bankAccountNumber,_bankID,AccountType(_accType),_amountDue);
            return true;
        }

    }

/*
 * @dev: Comapny pay installment amount to bank.
 * @param bytes32 _companyID : company id, who is paying installment.
 * @param bytes32 _bankAccountNumber : bank account number
 * @param uint256 _installmentAmount : installment amount
 * @param uint256 _dueDate : installment pay due date
 * @param uint256 _daysinArrear : days in arrear
 * @param uint256 _paymentDate : installment payment date
 * @param uint256 _accountBalance : remaining payable amount.
 * @return : bool : transaction added or not
 */
    function addCompanyToBankTx(bytes32 _companyID, bytes32 _bankAccountNumber, uint256 _installmentAmount, uint256 _dueDate,uint256 _daysinArrear, uint256 _paymentDate, uint256 _accountBalance) public returns (bool _isTx){
        require(CompanyDetails[_companyID].companyID!="");
        bytes32 _bankID = UserID[msg.sender];
        require(BankDetails[_bankID].bankAccountAddress == msg.sender);
        if(CompanyLoaninstallmentAmount[_companyID][_bankAccountNumber]==0)
        {
            return false;
        }
        else
        {
            if(_dueDate >= _paymentDate){
                CompanyDetails[_companyID].creditScore = CompanyDetails[_companyID].creditScore.safeAdd(1);
            } else if(_dueDate + _daysinArrear <= _paymentDate){
                CompanyDetails[_companyID].creditScore = CompanyDetails[_companyID].creditScore.safeSub(1);
            }
            TransactionB2C memory newTransaction;
            newTransaction.companyID =_companyID;
            newTransaction.bankID = _bankID;
            newTransaction.bankAccountNumber = _bankAccountNumber;
            newTransaction.installmentAmount = _installmentAmount;
            newTransaction.dueDate = _dueDate;
            newTransaction.daysinArrear = _daysinArrear;
            newTransaction.paymentDate = _paymentDate;
            newTransaction.txType = TransactionType(2);
            newTransaction.accountBalance = _accountBalance;
            TransactionDetailsB2C[_companyID].push(newTransaction);
            partners[_companyID][_bankID] = partners[_companyID][_bankID].safeAdd(1);
            emit newDebitTransactionBanktoCompany(_companyID,_bankAccountNumber,_bankID,_accountBalance);
            return true;
        }
    }

/*
 * @dev: Intiate new Contract Between Company to Company
 * @param bytes32 _company2ID : Company ID who want services of other provider company.
 * @param bytes32 _contractID : Contract ID 
 * @param uint256 _openDate : Contract Open date
 * @return : bool : contract added or not
 */
    function initiateNewC2C(bytes32 _company2ID, bytes32 _contractID, uint256 _openDate) public returns(bool _initiate) {
          require(CompanyDetails[_company2ID].companyID!="");
          bytes32 _company1ID = UserID[msg.sender];
          require(CompanyDetails[_company1ID].companyAccountAddress == msg.sender);

          if(CompanyContractTransaction[_company2ID][_contractID]!=0)
          {
              return false;
          }
          else
          {
              TransactionC2C memory newTransaction;
              newTransaction.company1ID = _company1ID;
              newTransaction.company2ID = _company2ID;
              newTransaction.contractID = _contractID;
              newTransaction.openDate = _openDate;
              newTransaction.txType = TransactionType(1);
              newTransaction.paymentDate = block.timestamp;
              TransactionDetailsC2C[_company2ID].push(newTransaction);
              CompanyContractTransaction[_company2ID][_contractID] = CompanyContractTransaction[_company2ID][_contractID].safeAdd(1);
              emit newContractCompanytoCompany(_company1ID,_company2ID,_contractID);
              return true;
          }
    }

/*
 * @dev: Installment payment of company to company contract
 * @param bytes32 _company2ID : borrower ID
 * @param bytes32 _contractID : contract ID
 * @param bytes32 _invoiceNumber : Invoice Number 
 * @param uint256 _installmentAmount : Installment amount according to invoice number
 * @param uint256 _dueDate : installment due date
 * @param uint256 _paymentDate : installment payment date
 * @param uint256 _daysInArrear : days in arrear
 * @return : bool : payment done or not
 */
    function addCompanyToCompanyTx(bytes32 _company2ID, bytes32 _contractID, bytes32 _invoiceNumber, uint256 _installmentAmount,uint256 _dueDate, uint256 _paymentDate, uint256 _daysInArrear, uint256 _outstandingBalance) public returns (bool _isTx) {
            require(CompanyDetails[_company2ID].companyID!="");
            bytes32 _company1ID = UserID[msg.sender];
            require(CompanyDetails[_company1ID].companyAccountAddress == msg.sender);

            if(CompanyContractTransaction[_company2ID][_contractID]==0)
            {
                return false;
            }
            else
            {
                if(_dueDate >= _paymentDate){
                    CompanyDetails[_company2ID].creditScore = CompanyDetails[_company2ID].creditScore.safeAdd(1);
                } else if(_dueDate + _daysInArrear <= _paymentDate){
                    CompanyDetails[_company2ID].creditScore = CompanyDetails[_company2ID].creditScore.safeSub(1);
                }
                TransactionC2C memory newTransaction;
                newTransaction.company1ID = _company1ID;
                newTransaction.company2ID = _company2ID;
                newTransaction.contractID = _contractID;
                newTransaction.invoiceNumber = _invoiceNumber;
                newTransaction.installmentAmount = _installmentAmount;
                newTransaction.dueDate = _dueDate;
                newTransaction.paymentDate = _paymentDate;
                newTransaction.daysinArrear = _daysInArrear;
                newTransaction.outstandingBalance = _outstandingBalance;
                newTransaction.txType = TransactionType(2);
                TransactionDetailsC2C[_company2ID].push(newTransaction);
                emit newDebitTransactionCompanytoCompany(_company1ID,_company2ID,_contractID);
                return true;
            }


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
    function updateArrearTime(bytes32 _lenderID,bytes32 _companyID,bytes32 _contractIDOrbankAccountNumber,uint256 _arrearDays,uint256 _dueDate,uint256 _amount,string _delayReason) public{
          bytes32 _collectionAgencyID = UserID[msg.sender];
          require(CollectionAgencyDetails[_collectionAgencyID].collectionAgencyAccountAddress == msg.sender);
          require(CompanyDetails[_lenderID].companyID!='0x0' || BankDetails[_lenderID].bankID!='0X0');
          CompanyDetails[_companyID].creditScore = CompanyDetails[_companyID].creditScore.safeSub(1);
          CollectionAgencyTx memory newCollectionAgencyTx;
            newCollectionAgencyTx.collectionAgencyID=_collectionAgencyID;
            newCollectionAgencyTx.lenderID=_lenderID;
            newCollectionAgencyTx.companyID=_companyID;
            newCollectionAgencyTx.contractIDOrbankAccountNumber=_contractIDOrbankAccountNumber;
            newCollectionAgencyTx.arrearDays=_arrearDays;
            newCollectionAgencyTx.dueDate=_dueDate;
            newCollectionAgencyTx.amount=_amount;
            newCollectionAgencyTx.delayReason=_delayReason;
            CollectionAgencyTxOnDelay[_companyID].push(newCollectionAgencyTx);
          emit DelayReason(_collectionAgencyID,_lenderID,_companyID,_contractIDOrbankAccountNumber,_arrearDays,_dueDate,_amount,_delayReason);
    }

/*
 * @dev: Bank will call on delay on payment (-ive Tx)
 * @param bytes32 _companyID : borrower ID
 * @param bytes32 _bankAccountNumber : Bank Account Number
 * @param uint256 _installmentAmount : Installment Amount
 * @param uint256 _dueDate : Installment due date
 * @param uint256 _delayDays : number of days delay
 */
    function delayOnPaymentC2B(bytes32 _companyID,bytes32 _bankAccountNumber,uint256 _installmentAmount, uint256 _dueDate, uint256 _delayDays) public {
          bytes32 _bankID = UserID[msg.sender];
            require(BankDetails[_bankID].bankAccountAddress == msg.sender);
            TransactionB2C memory newTransaction;
            newTransaction.companyID =_companyID;
            newTransaction.bankID = _bankID;
            newTransaction.bankAccountNumber = _bankAccountNumber;
            newTransaction.installmentAmount = _installmentAmount;
            newTransaction.dueDate = _dueDate;
            newTransaction.txType = TransactionType(2);
            TransactionDetailsB2C[_companyID].push(newTransaction);
            CompanyDetails[_companyID].creditScore = CompanyDetails[_companyID].creditScore.safeSub(1);
            partners[_bankID][_companyID] = partners[_bankID][_companyID].safeAdd(1);
          emit DelayOnTxC2B(_bankID,_companyID,_bankAccountNumber,_installmentAmount,_dueDate,_delayDays);
    }


 // * @dev: This function for credit score calculator for updating credit score by credit score engine.
 // * @param bytes32 _companyID : company ID
 // * @param uint256 _creditScore : new credit Score
 // * @return : bool : update
 
 //    function updateCreditScore(bytes32 _companyID,uint256 _creditScore) onlyOwner public returns(bool){
 //          CompanyDetails[_companyID].creditScore = _creditScore;
 //          return true;
 //    }


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
        require(BankDetails[_requester].bankAccountAddress == msg.sender || CompanyDetails[_requester].companyAccountAddress==msg.sender);
        if(partners[_companyID][_requester]>0 || AccessDuration[_companyID][_requester][0]<=block.timestamp && AccessDuration[_companyID][_requester][1]>=block.timestamp){
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
        require(CompanyDetails[_companyID].companyAccountAddress == msg.sender);
        return (CompanyDetails[_companyID].companyID,CompanyDetails[_companyID].companyName,CompanyDetails[_companyID].creditScore);
    }

/*
 * @dev: check total tx between parties 
 * @param uint8 _between : specify lender type(0=Comapny, 1=Bank, 2=CollectionAgency)
 * @return : totla number of tx
 */
    function totalTransaction(uint8 _between) public constant returns(uint256 count) {
                bytes32 _companyID = UserID[msg.sender];
        require(CompanyDetails[_companyID].companyAccountAddress == msg.sender);
        if(_between==0){
            return TransactionDetailsC2C[_companyID].length;
        }
        else if(_between==1){
            return TransactionDetailsB2C[_companyID].length;
        }
        else if(_between==2){
            return CollectionAgencyTxOnDelay[_companyID].length;
        }
    }

/*
 * @dev: retirve tx between company to bank
 * @param uint256 _index : tx index
 * @return : tx details 
 */
    function retriveTransactionsB2C(uint256 _index) public constant returns(bytes32 bankAccountNumber, bytes32 bankID, uint256 installmentAmount, TransactionType TxType, uint256 DueDate, uint256 PaymentorOpenDate){
        bytes32 _companyID = UserID[msg.sender];
        require(CompanyDetails[_companyID].companyAccountAddress==msg.sender);
        uint256 date = 0;
        if(TransactionDetailsB2C[_companyID][_index].txType == TransactionType(1)){
            date = TransactionDetailsB2C[_companyID][_index].openDate;
        }else{
            date = TransactionDetailsB2C[_companyID][_index].paymentDate;
        }
        return( TransactionDetailsB2C[_companyID][_index].bankAccountNumber,TransactionDetailsB2C[_companyID][_index].bankID,TransactionDetailsB2C[_companyID][_index].installmentAmount,TransactionDetailsB2C[_companyID][_index].txType,TransactionDetailsB2C[_companyID][_index].dueDate,date);
    }

/*
 * @dev: retirve tx between company to company
 * @param uint256 _index : tx index
 * @return : tx details 
 */
    function retriveTransactionC2C(uint256 _index) public constant returns(bytes32,bytes32,uint256,uint256,uint256,TransactionType){
        bytes32 _companyID = UserID[msg.sender];
        require(CompanyDetails[_companyID].companyAccountAddress==msg.sender);
        return(TransactionDetailsC2C[_companyID][_index].company2ID,TransactionDetailsC2C[_companyID][_index].contractID,TransactionDetailsC2C[_companyID][_index].installmentAmount,TransactionDetailsC2C[_companyID][_index].dueDate,TransactionDetailsC2C[_companyID][_index].daysinArrear,TransactionDetailsC2C[_companyID][_index].txType);
    }

/*
 * @dev: retirve tx by collecton agency on delay in payment
 * @param uint256 _index : tx index
 * @return : tx details 
 */
    function retriveCollectionAgencyTxOnDelay(uint256 _index) public constant returns(bytes32,bytes32,bytes32,uint256,uint256,string){
        bytes32 _companyID = UserID[msg.sender];
        require(CompanyDetails[_companyID].companyAccountAddress==msg.sender);
        return(CollectionAgencyTxOnDelay[_companyID][_index].collectionAgencyID,CollectionAgencyTxOnDelay[_companyID][_index].lenderID,CollectionAgencyTxOnDelay[_companyID][_index].contractIDOrbankAccountNumber,CollectionAgencyTxOnDelay[_companyID][_index].arrearDays,CollectionAgencyTxOnDelay[_companyID][_index].dueDate,CollectionAgencyTxOnDelay[_companyID][_index].delayReason);
    }
}
