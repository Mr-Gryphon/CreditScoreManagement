import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { Router, RouterModule } from '@angular/router';
import { BcService } from '../bc.service';

@Component({
	selector: 'app-admin',
	templateUrl: './admin.component.html',
	encapsulation: ViewEncapsulation.None,
	styleUrls: ['./admin.component.css'],
})
export class AdminComponent implements OnInit {
	closeResult: string;
	regaddress: any;
	bankname: any;
	aaddress: any;
	transactionDetails: any;
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
	submitBank() {
		this.transactionDetails = {}
		let formdata = {
			'aaddress': localStorage.getItem('address'),
			'bankname': this.bankname,
			'regaddress': this.regaddress
		}
		this.bcservice.registerbank(formdata).then(
			data => {
				// console.log(data)
				this.transactionDetails = data;
			},
			error => {
				const errorResponse = error.json();
			});
	}
	submitCompany() {
		this.transactionDetails = {}
		let formdata = {
			'aaddress': localStorage.getItem('address'),
			'bankname': this.bankname,
			'regaddress': this.regaddress
		}
		this.bcservice.registercompany(formdata).then(
			data => {
				console.log(data)
				this.transactionDetails = data;
			},
			error => {
				const errorResponse = error.json();
			});
	}
	submitAgency() {
		this.transactionDetails = {}
		let formdata = {
			'aaddress': localStorage.getItem('address'),
			'bankname': this.bankname,
			'regaddress': this.regaddress
		}
		this.bcservice.registeragency(formdata).then(
			data => {
				console.log(data)
				this.transactionDetails = data;
			},
			error => {
				const errorResponse = error.json();
			});
	}
}
