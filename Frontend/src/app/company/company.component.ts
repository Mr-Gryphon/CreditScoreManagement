import { Component, OnInit } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { Router, RouterModule } from '@angular/router';
import { BcService } from '../bc.service';

@Component({
	selector: 'app-company',
	templateUrl: './company.component.html',
	styleUrls: ['./company.component.css']
})
export class CompanyComponent implements OnInit {
	company1id: any;
	contractid: any;
	invoiceno: any;
	iamount: any;
	duedate: any;
	start_date: any;
	end_date: any;
	paymentdate: any;
	daysinarrear: any;
	obalance: any;
	companyid: any;
	lendertype: any;
	lenderid: any;
	transactionDetails: any;
	no_transaction: any
	no_hours: any;
	paymentdate_in_unix: any;
	duedate_in_unix: any;

	temp: any;
	constructor(
		private modalService: NgbModal,
		private router: Router,
		private bcservice: BcService,
	) {
		// router.events.subscribe((val) => {
		// 	// see also 
		// 	console.log(val)
		// });
	}

	ngOnInit() {
	}
	openVerticallyCentered(content) {
		this.modalService.open(content, { size: 'lg', centered: true });
	}
	jsonstringify(data) {
		// console.log(data)
		return JSON.stringify(data)
	}
	initiatec2ctxn1() {
		let formdata = {
			'address': localStorage.getItem('address'),
			'company1id': this.company1id,
			'contractid': this.contractid
		}
		this.bcservice.initiatec2ctxn(formdata).then(
			data => {
				console.log(data);
				this.transactionDetails = data;
			},
			error => {
				const errorResponse = error.json();
			})
	}
	AddC2CTxn1() {
		let formdata = {
			'address': localStorage.getItem('address'),
			'company1id': this.company1id,
			'contractid': this.contractid,
			'invoiceno': this.invoiceno,
			'iamount': this.iamount,
			'duedate': this.datetounix(this.duedate),
			'paymentdate': this.datetounix(this.paymentdate),
			'daysinarrear': this.daysinarrear,
			'obalance': this.obalance
		}
		this.bcservice.AddC2CTxn(formdata).then(
			data => {
				console.log(data);
				this.transactionDetails = data;
			},
			error => {
				const errorResponse = error.json();
			})
	}
	GetProfile1() {
		let formdata = {
			'address': localStorage.getItem('address'),
			// 'companyid': this.companyid
		}
		this.bcservice.GetProfile(formdata).then(
			data => {
				console.log(data);
				this.transactionDetails = data;
			},
			error => {
				const errorResponse = error.json();
			})
	}
	AllTxn1() {
		let formdata = {
			'address': localStorage.getItem('address'),
			'lendertype': this.lendertype,
			'no_transaction': this.no_transaction
		}
		this.bcservice.AllTxn(formdata).then(
			data => {
				console.log(data);
				this.transactionDetails = data;
			},
			error => {
				const errorResponse = error.json();
			})
	}
	GiveAccess1() {
		let formdata = {
			'address': localStorage.getItem('address'),
			'lenderid': this.lenderid,
			'start_date': this.datetounix(this.start_date),
			'end_date': this.datetounix(this.end_date)
		}
		this.bcservice.GiveAccess(formdata).then(
			data => {
				console.log(data);
				this.transactionDetails = data;
			},
			error => {
				const errorResponse = error.json();
			})
	}
	creditscore1() {
		let formdata = {
			'address': localStorage.getItem('address'),
			'bankid': this.lenderid
		}
		this.bcservice.creditscore(formdata).then(
			data => {
				console.log(data)
				this.transactionDetails = data;
			},
			error => {
				const errorResponse = error.json();
			});
	}
	datetounix(date) {
		let y = date.year, m = date.month, d = date.day;
		if (m.toString().length < 2) {
			console.log('here')
			m = '0' + m
		}
		if (d.toString().length < 2) {
			d = '0' + d
		}
		var d1 = y + '-' + m + '-' + d
		return Math.round(new Date(d1).getTime() / 1000);
	}
	days_arrear() {
		var mydate1 = this.paymentdate.month + "/" + this.paymentdate.day + "/" + this.paymentdate.year;
		var date1 = new Date(mydate1);
		var mydate2 = this.duedate.month + "/" + this.duedate.day + "/" + this.duedate.year;
		var date2 = new Date(mydate2);
		var timeDiff = date1.getTime() - date2.getTime();
		var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
		if (diffDays <= 0)
			this.daysinarrear = 0;
		else
			this.daysinarrear = diffDays;
	}	
	
}

