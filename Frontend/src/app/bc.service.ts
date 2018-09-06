import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Configration } from './web-config'
import { NgxSpinnerService } from 'ngx-spinner';

@Injectable({
	providedIn: 'root'
})
export class BcService {

	constructor(
		private http: Http,
		private spinner: NgxSpinnerService,
	) { }
	showLoader() {
		this.spinner.show();
	}
	hideLoader() {
		this.spinner.hide();
	}

	getaccountbalance(payload) {
		this.showLoader();
		return new Promise((resolve, reject) => {
			return this.http.post(Configration.adminurl + 'getAccountBalance', payload)
				.subscribe((success: any) => {
					this.hideLoader();
					return resolve(success.json())
				}, (error) => {
					console.log(error)
					this.hideLoader();
				});
		});
	}
	registerbank(payload) {
		this.showLoader();
		return new Promise((resolve, reject) => {
			return this.http.post(Configration.adminurl + 'registerBank', payload)
				.subscribe((success: any) => {
					this.hideLoader();
					return resolve(success.json())
				}, (error) => {
					this.hideLoader();
					console.log(error)
				});
		});
	}
	registercompany(payload) {
		this.showLoader();
		return new Promise((resolve, reject) => {
			return this.http.post(Configration.adminurl + 'registerCompany', payload)
				.subscribe((success: any) => {
					this.hideLoader();
					return resolve(success.json())
				}, (error) => {
					this.hideLoader();
					console.log(error)
				});
		});
	}
	registeragency(payload) {
		this.showLoader();
		return new Promise((resolve, reject) => {
			return this.http.post(Configration.adminurl + 'registerAgency', payload)
				.subscribe((success: any) => {
					this.hideLoader();
					return resolve(success.json())
				}, (error) => {
					this.hideLoader();
					console.log(error)
				});
		});
	}
	initiateb2c(payload) {
		this.showLoader();
		return new Promise((resolve, reject) => {
			return this.http.post(Configration.adminurl + 'initiateNewB2C', payload)
				.subscribe((success: any) => {
					this.hideLoader();
					return resolve(success.json())
				}, (error) => {
					this.hideLoader();
					console.log(error)
				});
		});
	}
	addC2BTxn(payload) {
		this.showLoader();
		return new Promise((resolve, reject) => {
			return this.http.post(Configration.adminurl + 'addCompanyToBankTxn', payload)
				.subscribe((success: any) => {
					this.hideLoader();
					return resolve(success.json())
				}, (error) => {
					this.hideLoader();
					console.log(error)
				});
		});
	}
	delaypayment(payload) {
		this.showLoader();
		return new Promise((resolve, reject) => {
			return this.http.post(Configration.adminurl + 'delayonpayment', payload)
				.subscribe((success: any) => {
					this.hideLoader();
					return resolve(success.json())
				}, (error) => {
					this.hideLoader();
					console.log(error)
				});
		});
	}
	creditscore(payload) {
		this.showLoader();
		return new Promise((resolve, reject) => {
			return this.http.post(Configration.adminurl + 'checkcreditscore', payload)
				.subscribe((success: any) => {
					this.hideLoader();
					return resolve(success.json())
				}, (error) => {
					this.hideLoader();
					console.log(error)
				});
		});
	}
	updateArrearTime(payload) {
		this.showLoader();
		return new Promise((resolve, reject) => {
			return this.http.post(Configration.adminurl + 'updateArrearTime', payload)
				.subscribe((success: any) => {
					this.hideLoader();
					return resolve(success.json())
				}, (error) => {
					this.hideLoader();
					console.log(error)
				});
		});
	}
	initiatec2ctxn(payload) {
		this.showLoader();
		return new Promise((resolve, reject) => {
			return this.http.post(Configration.adminurl + 'initiateC2CTxn', payload)
				.subscribe((success: any) => {
					this.hideLoader();
					return resolve(success.json())
				}, (error) => {
					this.hideLoader();
					console.log(error)
				});
		});
	}
	AddC2CTxn(payload) {
		this.showLoader();
		return new Promise((resolve, reject) => {
			return this.http.post(Configration.adminurl + 'AddC2CTxn', payload)
				.subscribe((success: any) => {
					this.hideLoader();
					return resolve(success.json())
				}, (error) => {
					this.hideLoader();
					console.log(error)
				});
		});
	}
	GetProfile(payload) {
		this.showLoader();
		return new Promise((resolve, reject) => {
			return this.http.post(Configration.adminurl + 'GetProfile', payload)
				.subscribe((success: any) => {
					this.hideLoader();
					return resolve(success.json())
				}, (error) => {
					this.hideLoader();
					console.log(error)
				});
		});
	}
	AllTxn(payload) {
		this.showLoader();
		return new Promise((resolve, reject) => {
			return this.http.post(Configration.adminurl + 'AllTxn', payload)
				.subscribe((success: any) => {
					this.hideLoader();
					return resolve(success.json())
				}, (error) => {
					this.hideLoader();
					console.log(error)
				});
		});
	}
	GiveAccess(payload) {
		this.showLoader();
		return new Promise((resolve, reject) => {
			return this.http.post(Configration.adminurl + 'GiveAccess', payload)
				.subscribe((success: any) => {
					this.hideLoader();
					return resolve(success.json())
				}, (error) => {
					this.hideLoader();
					console.log(error)
				});
		});
	}
	BankLogin(payload) {
		this.showLoader();
		return new Promise((resolve, reject) => {
			return this.http.post(Configration.adminurl + 'LoginHere', payload)
				.subscribe((success: any) => {
					this.hideLoader();
					return resolve(success.json())
				}, (error) => {
					this.hideLoader();
					console.log(error)
				});
		});
	}
	CompanyLogin(payload) {
		this.showLoader();
		return new Promise((resolve, reject) => {
			return this.http.post(Configration.adminurl + 'LoginHere', payload)
				.subscribe((success: any) => {
					this.hideLoader();
					return resolve(success.json())
				}, (error) => {
					this.hideLoader();
					console.log(error)
				});
		});
	}
	CAgencyLogin(payload) {
		this.showLoader();
		return new Promise((resolve, reject) => {
			return this.http.post(Configration.adminurl + 'LoginHere', payload)
				.subscribe((success: any) => {
					this.hideLoader();
					return resolve(success.json())
				}, (error) => {
					this.hideLoader();
					console.log(error)
				});
		});
	}
	AdminLogin(payload) {
		this.showLoader();
		return new Promise((resolve, reject) => {
			return this.http.post(Configration.adminurl + 'LoginHere', payload)
				.subscribe((success: any) => {
					this.hideLoader();
					return resolve(success.json())
				}, (error) => {
					this.hideLoader();
					console.log(error)
				});
		});
	}
}
