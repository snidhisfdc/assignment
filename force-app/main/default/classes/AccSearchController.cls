public class AccSearchController {
	
    @AuraEnabled(cacheable=true)
    public static List<Account> fetchAccount(){
       return [Select Id,Name,Owner.Name,Phone,Website,AnnualRevenue,Industry from Account where Industry = 'Financial Services' ];
    }
}