// Debug script to test button functionality
console.log('Testing button functionality...');

// Test 1: Check if buttons are clickable
document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('button');
  console.log(`Found ${buttons.length} buttons on page`);
  
  buttons.forEach((btn, index) => {
    if (btn.disabled) {
      console.log(`Button ${index} is disabled:`, btn.textContent);
    }
    
    // Add click event listener to test
    btn.addEventListener('click', (e) => {
      console.log(`Button clicked:`, btn.textContent, e);
    });
  });
});

// Test 2: Check API endpoints
const testAPI = async () => {
  try {
    const response = await fetch('/api/auth/user', {
      credentials: 'include'
    });
    console.log('Auth status:', response.status);
    
    if (response.ok) {
      const user = await response.json();
      console.log('User:', user);
    }
  } catch (error) {
    console.error('API test failed:', error);
  }
};

testAPI();