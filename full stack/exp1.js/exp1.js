async function fetchUsers() {
  try {
    const response = await fetch("https://fake-json-api.mock.beeceptor.com/users");
    
    const data = await response.json();
    
    console.log("API Response:", data);
  } 
  catch (error) {
    console.log("Error:", error);
  }
}

fetchUsers();