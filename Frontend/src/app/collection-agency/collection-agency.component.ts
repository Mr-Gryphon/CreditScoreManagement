import { Component, OnInit } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { Router, RouterModule } from '@angular/router';
import { BcService } from '../bc.service';

@Component({
	selector: 'app-collection-agency',
	templateUrl: './collection-agency.component.html',
	styleUrls: ['./collection-agency.component.css']
})
export class CollectionAgencyComponent implements OnInit {
	delayreason: any;
	daysinarrear: any;
	bankano: any;
	caid: any;
	lenderid: any;
	companyid: any;
	transactionDetails: any;
	payment_due_date: any;
	payment_due_amt: any;
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
	updateArrearTime() {
		let formdata = {
			'address': localStorage.getItem('address'),
			'delayreason': this.delayreason,
			'daysinarrear': (this.daysinarrear) * 86400 + this.datetounix(this.payment_due_date),
			'bankano': this.bankano,
			'caid': this.caid,
			'lenderid': this.lenderid,
			'companyid': this.companyid,
			'payment_due_amt': this.payment_due_amt,
			'payment_due_date': this.datetounix(this.payment_due_date)
		}
		this.bcservice.updateArrearTime(formdata).then(
			data => {
				console.log(data);
				this.transactionDetails = data;
			},
			error => {
				const errorResponse = error.json();
			})
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
}
