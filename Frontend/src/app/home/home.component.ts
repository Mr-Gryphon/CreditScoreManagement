import { Component, OnInit } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { BcService } from '../bc.service';
import { Router, RouterModule } from '@angular/router';


@Component({
	selector: 'app-home',
	templateUrl: './home.component.html',
	styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
	aaddress: any;
	password: any;
	routerurl: any;
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
		localStorage.setItem('address', '0')
	}
	openVerticallyCentered(content) {
		this.modalService.open(content, { centered: true });
	}
	BankLogin() {
		let formdata = {
			'aaddress': this.aaddress,
			'password': this.password
		}
		localStorage.setItem('address', this.aaddress)
		console.log(formdata)
		this.bcservice.BankLogin(formdata).then(
			data => {
				if (data['result'] == true) {
					this.routerurl = '/bank'
					this.router.navigate([this.routerurl]);
				}
			},
			error => {
				console.log(error)
			});
	}
	CompanyLogin() {
		let formdata = {
			'aaddress': this.aaddress,
			'password': this.password
		}
		localStorage.setItem('address', this.aaddress)
		this.bcservice.CompanyLogin(formdata).then(
			data => {
				if (data['result'] == true) {
					this.routerurl = '/company'
					this.router.navigate([this.routerurl]);
				}
			},
			error => {
				console.log(error)
			});
	}
	CAgencyLogin() {
		let formdata = {
			'aaddress': this.aaddress,
			'password': this.password
		}
		localStorage.setItem('address', this.aaddress)
		this.bcservice.CAgencyLogin(formdata).then(
			data => {
				if (data['result'] == true) {
					this.routerurl = '/col-agency'
					this.router.navigate([this.routerurl]);
				}
			},
			error => {
				console.log(error)
			});
	}
	AdminLogin() {
		let formdata = {
			'aaddress': this.aaddress,
			'password': this.password
		}
		localStorage.setItem('address', this.aaddress)
		this.bcservice.AdminLogin(formdata).then(
			data => {
				if (data['result'] == true) {
					this.routerurl = '/admin'
					this.router.navigate([this.routerurl]);
				}
			},
			error => {
				console.log(error)
			});
	}
}
