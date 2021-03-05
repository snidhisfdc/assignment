import { LightningElement,api,wire } from 'lwc';
import fetchAccount from '@salesforce/apex/AccSearchController.fetchAccount';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { updateRecord } from 'lightning/uiRecordApi';


export default class AccDisplaySort extends LightningElement {
    @api mycolumns = [
        {label:'Account Name', fieldName:'NameUrl',sortable: "true",editable : "true",type: 'url',
        typeAttributes: {label: { fieldName: 'Name' },target: '_blank' }},
        {label:'Account Owner', fieldName:'AccountOwner',sortable: "true",editable : "true"},
        {label:'Phone', fieldName:'Phone',editable : "true"},
        {label:'Website', fieldName:'Website',editable : "true"},
        {label:'Annual Revenue', fieldName:'AnnualRevenue',editable : "true"},
    ];
    sortBy;
    sortDirection;
    error;
    accList;
    finalaccList;
    saveDraftValues = [];

    @wire(fetchAccount) 
    accounts({error,data}){
        if(data){
            let rowData = [];
            data.forEach((acc)=>{
                let currentData = {};
                try{
                    currentData.NameUrl = `/${acc.Id}`;
                    currentData.Name = acc.Name;
                    currentData.AccountOwner = acc.Owner.Name;
                    currentData.Phone = acc.Phone;
                    currentData.Website = acc.Website;
                    currentData.AnnualRevenue = acc.AnnualRevenue; 
                    rowData.push(currentData);
                }catch(e){}
                
              });
              this.accList=rowData;
              this.finalaccList = rowData;
            this.error = undefined;
        } else if(error){
            this.accList = undefined;
            this.finalaccList = undefined;
            this.error =  error;
        }
        
    }
    handleSort(event) {
        this.sortBy = event.detail.fieldName;
        this.sortDirection = event.detail.sortDirection;
        this.sortData(this.sortBy, this.sortDirection);
    }

    sortData(fieldname, direction) {
        let parseData = JSON.parse(JSON.stringify(this.accList));
        this.accList = parseData.sort(function(a,b){
            if(a[fieldname] < b[fieldname]){
              return direction === 'asc' ? -1 : 1;
            }
            else if(a[fieldname] > b[fieldname]){
              return direction === 'asc' ? 1 : -1;
            }
            else
              return 0;
          })
        }  

    filterAccount(event){
        const searchKey = event.target.value;
        if(searchKey){
            if(this.accList){
                let filteracc=[];
                for(let acc of this.accList){
                    let valuesArray = Object.values(acc);
                    console.log('insert acc');
                    console.log(acc.Name.toLowerCase());
                    if (acc.Name.toLowerCase().includes(searchKey)){

                        filteracc.push(acc);
                
                    }
                }
                this.finalaccList = filteracc;
            }
        } else {
            this.finalaccList = this.accList;
        }
    }

    handleSave(event) {
        this.saveDraftValues = event.detail.draftValues;
        const recordInputs = this.saveDraftValues.slice().map(draft => {
            const fields = Object.assign({}, draft);
            return { fields };
        });

        // Updateing the records using the UiRecordAPi
        const promises = recordInputs.map(recordInput => updateRecord(recordInput));
        Promise.all(promises).then(res => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Records Updated Successfully!!',
                    variant: 'success'
                })
            );
            this.saveDraftValues = [];
            return this.refresh();
        }).catch(error => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error',
                    message: 'An Error Occured!!',
                    variant: 'error'
                })
            );
        }).finally(() => {
            this.saveDraftValues = [];
        });
    }

    // This function is used to refresh the table once data updated
    async refresh() {
        await refreshApex(this.accList);
    }

}