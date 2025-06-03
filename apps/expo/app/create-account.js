import { useState, useEffect } from 'react';
import { getData } from 'app/components/nav/expo-screen'; // Assuming getData is exported and path is correct
import { Root } from 'app/root'; // Assuming Root is exported and path is correct
import { Loading } from 'app/loading'; // Assuming Loading is exported
import { Text } from 'react-native';

export default function CreateAccount() {
  const [pageData, setPageData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        // Determine the correct path/identifier for the create-account page data
        // This might be 'create-account', or a more specific API endpoint path
        const data = await getData('create-account', null, null, null, null, null);
        if (data?.props) {
          setPageData(data.props);
        } else {
          setError('Failed to load page data: Invalid data structure');
          console.error('Invalid data structure from getData:', data);
        }
      } catch (e) {
        setError('Failed to load page data: ' + e.message);
        console.error('Error fetching page data for create-account:', e);
      }
    };

    fetchPageData();
  }, []);

  if (error) {
    // You might want a more user-friendly error display
    return <Text>Error: {error}</Text>; 
  }

  if (!pageData) {
    return <Loading />;
  }

  // The Root component should handle passing relevant parts of pageData
  // (like blocks and specific data) to the underlying PageLayout for create-account.
  return <Root path="/create-account" data={pageData.data} uri={pageData.data?.uri || '/create-account'} />;
} 