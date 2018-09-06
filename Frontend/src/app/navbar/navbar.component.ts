import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { BcService } from '../bc.service';


@Component({
	selector: 'app-navbar',
	templateUrl: './navbar.component.html',
	styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
	// collapse: string = "closed";
	show: boolean = false;
	adminshow: boolean = false;
	bankshow: boolean = false;
	companyshow: boolean = false;
	col_agencyshow: boolean = false;
	homeshow: boolean = false;
	balance: any;
	aaddress: any;
	password: any;
	routerurl: any;
	constructor(
		private router: Router,
		private modalService: NgbModal,
		private bcservice: BcService,
	) {
		// router.events.subscribe((val) => {
		// 	// see also 
		// 	console.log(val)
		// });
	}

	ngOnInit() {
		this.adminshow = false;
		this.bankshow = false;
		this.companyshow = false;
		this.col_agencyshow = false;
		this.homeshow = false;

		if (this.router.url === '/admin') {
			this.adminshow = true;
			this.bankshow = false;
			this.companyshow = false;
			this.col_agencyshow = false;
			this.homeshow = false;
			let formdata = {
				'address': localStorage.getItem('address')
			}
			this.bcservice.getaccountbalance(formdata).then(
				data => {
					console.log(data)
					this.balance = data
				},
				error => {
					const errorResponse = error.json();
				});
		} else if (this.router.url === '/company') {
			this.adminshow = false;
			this.bankshow = false;
			this.companyshow = true;
			this.col_agencyshow = false;
			this.homeshow = false;
			let formdata = {
				'address': localStorage.getItem('address')
			}
			this.bcservice.getaccountbalance(formdata).then(
				data => {
					console.log(data)
					this.balance = data
				},
				error => {
					const errorResponse = error.json();
				});
		} else if (this.router.url === '/bank') {
			this.adminshow = false;
			this.bankshow = true;
			this.companyshow = false;
			this.col_agencyshow = false;
			this.homeshow = false;
			let formdata = {
				'address': localStorage.getItem('address')
			}
			this.bcservice.getaccountbalance(formdata).then(
				data => {
					console.log(data)
					this.balance = data
				},
				error => {
					const errorResponse = error.json();
				});
		} else if (this.router.url === '/col-agency') {
			this.adminshow = false;
			this.bankshow = false;
			this.companyshow = false;
			this.col_agencyshow = true;
			this.homeshow = false;
			let formdata = {
				'address': localStorage.getItem('address')
			}
			this.bcservice.getaccountbalance(formdata).then(
				data => {
					console.log(data)
					this.balance = data
				},
				error => {
					const errorResponse = error.json();
				});
		} else {
			this.adminshow = false;
			this.bankshow = false;
			this.companyshow = false;
			this.col_agencyshow = false;
			this.homeshow = true;
		}
	}

	toggleCollapse() {
		this.show = !this.show
		// this.collapse = this.collapse == "open" ? 'closed' : 'open';
	}
	openVerticallyCentered(content) {
		this.modalService.open(content, { centered: true });
	}
	BankLogin() {
		let formdata = {
			'aaddress': this.aaddress,
			'password': this.password
		}
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
