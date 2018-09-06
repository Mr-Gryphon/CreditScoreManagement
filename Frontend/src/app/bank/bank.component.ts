import { Component, OnInit } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { Router, RouterModule } from '@angular/router';
import { BcService } from '../bc.service';
import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';

@Component({
	selector: 'app-bank',
	templateUrl: './bank.component.html',
	styleUrls: ['./bank.component.css']
})
export class BankComponent implements OnInit {
	companyid: any;
	bankano: any;
	amountdue: any;
	accounttype: any = 'Select Account Type';
	installmentamount: any;
	duedate: any;
	daysinarrear: any;
	paymentdate: any;
	abalance: any;
	delaydays: any;
	address: any;
	transactionDetails: any;
	unixDate: any;


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
	initiateb2c() {
		let formdata = {
			'address': localStorage.getItem('address'),
			'companyid': this.companyid,
			'bankano': this.bankano,
			'amountdue': this.amountdue,
			'accounttype': this.accounttype
		}
		this.bcservice.initiateb2c(formdata).then(
			data => {
				console.log(data)
				this.transactionDetails = data;
			},
			error => {
				const errorResponse = error.json();
			});
	}
	addC2CTxn() {
		let formdata = {
			'address': localStorage.getItem('address'),
			'companyid': this.companyid,
			'bankano': this.bankano,
			'installmentamount': this.installmentamount,
			'duedate':(this.duedate),
			'daysinarrear': (this.daysinarrear) ,
			'paymentdate':(this.paymentdate),
			'abalance': this.abalance
		}
		console.log(formdata);

		this.bcservice.addC2BTxn(formdata).then(
			data => {
				console.log(data)
				this.transactionDetails = data;
			},
			error => {
				const errorResponse = error.json();
			});
	}
	// convertToUnix() {
	// 	this.unixDate = new Date(this.paymentdate).getTime() / 1000;
	// 	// alert(this.unixDate)
	// }
	delaypayment() {
		let formdata = {
			'address': localStorage.getItem('address'),
			'companyid': this.companyid,
			'bankano': this.bankano,
			'installmentamount': this.installmentamount,
			'duedate':(this.duedate),
			'delaydays': (this.delaydays) 
		}
		this.bcservice.delaypayment(formdata).then(
			data => {
				console.log(data)
				this.transactionDetails = data;
			},
			error => {
				const errorResponse = error.json();
			});
	}
	creditscore() {
		let formdata = {
			'address': localStorage.getItem('address'),
			'companyid': this.companyid
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
