angular.module('myApp')
  .controller('ProfileController', function($scope, $http, $state, $window, socket, Account) {
    var loggedInInformation; 
    $scope.liveCodeShare = function() {
      socket.emit("startLiveEditing", {toName: $scope.text, fromName: Account.getUserDisplayName()});
    };
    // $window.confirm("hello")
    
    //socket listener  for mediumLiveEdit. 
    socket.on("mediumLiveEdit", function(data) {
      //if there names match the ones given from the medium live edit
      if (Account.getUserDisplayName() === data.toName || Account.getUserDisplayName() === data.fromName){
        //do confirm question
        var goToCodeShare = $window.confirm("Go to live Code Share?");
        //if confirm true 
        if (goToCodeShare) {
          //set title to a value 
          Account.setTitle(data.toName + data.fromName);
          //state.go codeshare
          $state.go("codeshare");
        }    
      } 
    });
    $scope.getProfile = function() {
      Account.setChekIfActivelyLoggedIn(false); 
      //set promise variable to equal return of Account.getProfile so we can chain promise and fix the check for the req.sessions once someone immediately logs in. 
      var promise = Account.getProfile()
        .then(function(response) {
          $scope.user = response.data.profile;
          //sets the displayName in the localStorage of the browser. 
          Account.storeUserDisplayName(response.data.profile.displayName);
          console.log("response.data.profile", response.data.profile);
          return {};
        })
        .catch(function(response) {
          console.log("We have caught a response:", response);
        });
        return promise;
    };

    //the first time a user comes to the profile page without signing in. 
    if (Account.getCheckingIfLogInData() === null) {
      Account.setCheckingIfLogInData(1);
      Account.setCheckIfLoggedOut(true);
    }
    //if the person is not logged 
    if (Account.getChekIfActivelyLoggedIn() && Account.getCheckingIfLogInData() !== '1') {
      //setting a check to tell the code that the user is logged in
      Account.setCheckingIfLogInData(1);
      //accessing the github passport. 
      $scope.getProfile().then(function() {}, function(err) {
        console.log("This is a err", err);
      });
    //A outer chekc to see if the user is logged in or not
    }else if (Account.getCheckingIfLogInData() === '1' ){
      //if they are not logged in, then redirect them to the login page.
      if (Account.getCheckIfLoggedOut() == 'true') {
        $state.go('login');

        //else if they are already logged in. 
      } else {
        //Use displayName to search for the user in the database. 
        $http.post('/getFromDatabaseBecausePersonSignedIn', {displayName: Account.getUserDisplayName()})
          .success(function(data, status) {
            $scope.user = data.user;
          });
      }
    }
  });