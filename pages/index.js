// pages/index.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import tw from "tailwind-styled-components";
import Map from "../components/Map";
import { SiUber } from "react-icons/si";
import { FaCar, FaPlusCircle, FaCalendarAlt, FaBell } from "react-icons/fa";
import Link from "next/link";
import ReservedRidesModal from '../components/ReservedRidesModal';
import { Toaster, toast } from 'sonner';
import { useRef } from "react";
import { FaExclamationTriangle } from "react-icons/fa";

import ReportModal from "../components/ReportModal";;

const Index = () => {
  const mapRef = useRef(null); // Create a ref for the Map component

  const [user, setUser] = useState(null);
  const [location, setLocation] = useState([44, 36.2]);
  const [hasReservations, setHasReservations] = useState(false);
  const router = useRouter();
  const [reservations, setReservations] = useState({});
  const [showReservedRidesModal, setShowReservedRidesModal] = useState(false);
  const [counter, setCounter] = useState(0);
  const [role, setRole] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const handleShowReportModal = () => {
    setShowReportModal(true);
  };

  const handleCloseReportModal = () => {
    setShowReportModal(false);
  };

  const handleReportToAdmin = ({ problemType, problemDetails }) => {
    // Handle the report submission logic here
    console.log('Problem Type:', problemType);
    console.log('Problem Details:', problemDetails);
  };
  useEffect(() => {
    const storedRole = localStorage.getItem('role');
    setRole(storedRole);
  }, [router]);



  //useEffect to check if user is connected
  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      router.push('/login');
    } else {
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        setUser({
          role: role,
          id: decodedToken.userId,
          firstName: decodedToken.firstName,
          lastName: decodedToken.lastName,
          photoUrl: 'userImage/userProfile.jpg'
        });
      } catch (error) {
        console.error('Error decoding token:', error);
        localStorage.removeItem('token'); // Remove invalid token
        router.push('/login');
      }
    }
  }, [router, role]);

  // useEffect(() => {
  //   // Fetch initial reservations
  //   if (user && user.id) {
  //     fetchReservations();
  //   }
  // }, [user]);


  //useEffect to fetch reservations periodically
  useEffect(() => {

    const intervalCleanup = fetchReservationsPeriodically();

    return () => {
      clearInterval(intervalCleanup);
    };
  }, [user]);


  //function to fetch the reservations periodically
  const fetchReservationsPeriodically = () => {
    if (user && role === 'driver') {
      return;
    }
    const intervalId = setInterval(async () => {
      try {
        await fetchReservations();
      } catch (error) {
        console.error('Error fetching reservations:', error);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  };



  //function to fetch reservations
  const fetchReservations = async () => {
    try {

      if (!user || !user.id) {
        return;
      }

      const response = await fetch(`/api/apiReservation?userId=${user.id}`);
      const data = await response.json();
      // console.log('API Response for reservations:', data);

      if (data.reservations) {
        setReservations(data.reservations);
      } else {
        setReservations({});
      }

      setHasReservations(data.hasReservations);

      setCounter((prevCounter) => {
        const newCounter = data.numberOfReservations;

        if (newCounter > prevCounter) {
          toast.success('You have a new reservation!');
        }

        return newCounter;
      });
    } catch (error) {
      console.error('Error fetching reservations:', error);
    }
  };



  //useEffect to update user location
  useEffect(() => {
    const updateLocation = async () => {
      try {
        const position = await getCurrentLocation();
        setLocation([position.coords.longitude, position.coords.latitude]);
      } catch (error) {
        console.error("Error getting location:", error);
      }
    };

    updateLocation();
  }, []);

  const handleShowReservedRides = () => {
    console.log('Showing reserved rides modal');
    setShowReservedRidesModal(true);
  };

  const handleCloseReservedRidesModal = () => {
    setShowReservedRidesModal(false);
  };

  //function to get current location
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      const watchId = navigator.geolocation.watchPosition(
        (position) => resolve(position),
        (error) => reject(error)
      );

      setTimeout(() => navigator.geolocation.clearWatch(watchId), 3000);
    });
  };


  const handleDisconnect = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };





  function showInMap(reservations) {
    if (!mapRef.current) {
      console.log('mapRef.current is null', mapRef.current);
      return;
    }

    const destinationLocationString = `${reservations.destinationLongitude},${reservations.destinationLatitude}`;
    mapRef.current.showPin(destinationLocationString, reservations.destinationLocation);
    console.log(reservations)
    console.log(reservations.destinationLocation)
    mapRef.current.showRoad(location, destinationLocationString);
  }


  const handleProfileClick = () => {
    // Redirect to the user profile page
    router.push('/userProfile');
  };


  return (
    <Wrapper>

      <SectionAside>
        <Title><span className="bg-black text-white rounded-md p-1.5">Get</span> <span className="p-1.5">Right</span> </Title>
        <ActionItems>
          <ActionButtons>
            <Link href="/search" passHref>
              <ActionButton className="flex flex-col items-center justify-center">
                <ActionButtonImage>
                  <FaCar size={50} />
                </ActionButtonImage>
                Search Ride
              </ActionButton>
            </Link>

            <Link href="/createRide" passHref>
              <ActionButton className="flex flex-col items-center justify-center">
                <ActionButtonImage>
                  <FaPlusCircle size={50} />
                </ActionButtonImage>
                Create a Trip
              </ActionButton>
            </Link>

            <Link href="/see_trips" passHref>
              <ActionButton className="flex flex-col items-center justify-center">
                <ActionButtonImage>
                  <FaCalendarAlt size={50} />
                </ActionButtonImage>
                See all Trips
              </ActionButton>
            </Link>
          </ActionButtons>

          <div className="flex flex-col items-center mt-auto w-full">
            {user && role === 'driver' ? (
              <Link href="/manageProposedDrives" passHref>
                <div className="text-center justify-center">
                  <ActionButtonBottom className="">Proposed trips</ActionButtonBottom>
                </div>
              </Link>
            ) : (
              <Link href="/proposeDrive" passHref>
                <div className=" text-center justify-center">
                  <ActionButtonBottom className="w-full text-center">
                    Propose a trip
                  </ActionButtonBottom>
                </div>
              </Link>
            )}
          </div>
        </ActionItems>
      </SectionAside>





      <SectionMain>
        <NavBar>
          <UserProfileSection
            user={user}
            role={role}
            counter={counter}
            handleShowReservedRides={handleShowReservedRides}
            handleDisconnect={handleDisconnect}
            handleReportToAdmin={handleShowReportModal}
            handleProfileClick={handleProfileClick}
          />
        </NavBar>

        <Map ref={mapRef} location={location} />
      </SectionMain>

      {showReservedRidesModal && (
        <ReservedRidesModal
          reservations={reservations}
          onClose={handleCloseReservedRidesModal}
          location={location}
          showInMap={showInMap}
        />
      )}

      <ReportModal isOpen={showReportModal} onClose={handleCloseReportModal} onSubmit={handleReportToAdmin} />


    </Wrapper>
  );
};

const UserProfileSection = ({ user, role, counter, handleShowReservedRides, handleDisconnect, handleReportToAdmin, handleProfileClick }) => (
  <div className="flex items-center space-x-4 justify-between w-full">
    {user && role === 'driver' ? (
      <Link href="/manageDrives" passHref>
        <ActionButtonReservedDrives>Manage My Drives</ActionButtonReservedDrives>
      </Link>
    ) : (
      <div className="flex items-center space-x-2">

        <div className="flex items-center">
          <div className="bg-red-500 text-white text-center mb-8 -ml-2 absolute h-6 w-6 font-bold rounded-full">
            {counter}
          </div>
          <ActionButtonReservedDrives onClick={handleShowReservedRides}>
            My reserved rides
          </ActionButtonReservedDrives>
        </div>

      </div>
    )}
    <ActionButtonReport onClick={handleReportToAdmin}>
      <FaExclamationTriangle size={24} />
      Report to Admin
    </ActionButtonReport>
    <div className="flex space-x-2 items-center ">
      <Profile>
        <div className="text-2xl font-bold text-blue-700">
          {user && `${user.firstName} ${user.lastName}`}
        </div>
        <UserImage
          src={user && user.photoUrl}
          alt="User Photo"
          className="h-16 w-16 cursor-pointer rounded-full border-4 border-blue-800"
          onClick={handleProfileClick}
        />
      </Profile>

      <DisconnectButton onClick={handleDisconnect}>Disconnect</DisconnectButton>

      <div className="flex space-x-2 items-center">

      </div>
    </div>

  </div>
);



const ActionButtonReport = tw.button`
  inline-block flex flex-col items-center  rounded-2xl bg-red-500 text-white px-6 pb-2 pt-2.5 text-xl uppercase leading-normal text-center shadow-[0_4px_9px_-4px_rgba(51,45,45,0.7)] transition-all duration-500 ease-in-out hover:bg-red-600 focus:bg-red-600 focus:outline-none focus:ring-0 active:bg-red-700 active:shadow-[0_8px_9px_-4px_rgba(51,45,45,0.2),0_4px_18px_0_rgba(51,45,45,0.1)] dark:bg-red-500 dark:shadow-[0_4px_9px_-4px_#030202] dark:hover:bg-red-600 dark:hover:shadow-[0_8px_9px_-4px_rgba(3,2,2,0.3),0_4px_18px_0_rgba(3,2,2,0.2)] dark:focus:bg-red-600 dark:focus:shadow-[0_8px_9px_-4px_rgba(3,2,2,0.3),0_4px_18px_0_rgba(3,2,2,0.2)] dark:active:bg-red-700 dark:active:shadow-[0_8px_9px_-4px_rgba(3,2,2,0.3),0_4px_18px_0_rgba(3,2,2,0.2)] font-medium
`;

const Wrapper = tw.div`
  flex flex-row bg-white h-screen transition-all duration-500 ease-in-out
`;


const Title = tw.h1`
  text-3xl uppercase mt-6 font-bold mb-6
`;

const SectionMain = tw.div`
  flex-1 flex flex-col
`;

const NavBar = tw.div`
 pl-8 pr-4 py-4 bg-gray-100 shadow-lg text-white flex flex-row justify-stretch items-center
`;

const ActionButtonReservedDrives = tw.button`
 bg-green-500 text-xl text-white px-2 py-1 rounded-xl hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50
`;




const DisconnectButton = tw.button`
  inline-block rounded-2xl bg-black h-10 text-white px-2 py-1 text-xl font-medium uppercase leading-normal text-center transition-all duration-500 ease-in-out hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:ring-opacity-50 active:bg-gray-900 
`;

const Profile = tw.div`
  flex items-center space-x-4 
`;

const UserImage = tw.img`
  h-8 w-auto cursor-pointer rounded-full transition-all duration-500 ease-in-out
`;



const ActionButton = tw.button`
  inline-block flex flex-col items-center w-full rounded-2xl bg-gray-200 text-black px-2 pb-2 pt-2.5 text-2xl  uppercase leading-normal text-center shadow-[0_4px_9px_-4px_rgba(51,45,45,0.7)] transition-all duration-500 ease-in-out hover:bg-gray-300 hover:shadow-[0_8px_9px_-4px_rgba(51,45,45,0.2),0_4px_18px_0_rgba(51,45,45,0.1)] focus:bg-gray-300 focus:shadow-[0_8px_9px_-4px_rgba(51,45,45,0.2),0_4px_18px_0_rgba(51,45,45,0.1)] focus:outline-none focus:ring-0 active:bg-gray-300 active:shadow-[0_8px_9px_-4px_rgba(51,45,45,0.2),0_4px_18px_0_rgba(51,45,45,0.1)] dark:bg-gray-200 dark:shadow-[0_4px_9px_-4px_#030202] dark:hover:bg-gray-300 dark:hover:shadow-[0_8px_9px_-4px_rgba(3,2,2,0.3),0_4px_18px_0_rgba(3,2,2,0.2)] dark:focus:bg-gray-300 dark:focus:shadow-[0_8px_9px_-4px_rgba(3,2,2,0.3),0_4px_18px_0_rgba(3,2,2,0.2)] dark:active:bg-gray-300 dark:active:shadow-[0_8px_9px_-4px_rgba(3,2,2,0.3),0_4px_18px_0_rgba(3,2,2,0.2)] font-medium
`;

const ActionItems = tw.div`
  flex flex-col transition-all duration-500 ease-in-out bg-white rounded-lg shadow-lg p-8 mb-2 h-full
`;

const ActionButtons = tw.div`
  flex flex-col justify-between transition-all duration-500 ease-in-out gap-6 mt-4
`;

const ActionButtonBottom = tw.button`
  inline-block flex flex-col items-center w-full rounded-2xl bg-gray-200 text-black px-6 pb-2 pt-2.5 text-2xl uppercase leading-normal text-center shadow-[0_4px_9px_-4px_rgba(51,45,45,0.7)] transition-all duration-500 ease-in-out hover:bg-gray-300 hover:shadow-[0_8px_9px_-4px_rgba(51,45,45,0.2),0_4px_18px_0_rgba(51,45,45,0.1)] focus:bg-gray-300 focus:shadow-[0_8px_9px_-4px_rgba(51,45,45,0.2),0_4px_18px_0_rgba(51,45,45,0.1)] focus:outline-none focus:ring-0 active:bg-gray-300 active:shadow-[0_8px_9px_-4px_rgba(51,45,45,0.2),0_4px_18px_0_rgba(51,45,45,0.1)] dark:bg-gray-200 dark:shadow-[0_4px_9px_-4px_#030202] dark:hover:bg-gray-300 dark:hover:shadow-[0_8px_9px_-4px_rgba(3,2,2,0.3),0_4px_18px_0_rgba(3,2,2,0.2)] dark:focus:bg-gray-300 dark:focus:shadow-[0_8px_9px_-4px_rgba(3,2,2,0.3),0_4px_18px_0_rgba(3,2,2,0.2)] dark:active:bg-gray-300 dark:active:shadow-[0_8px_9px_-4px_rgba(3,2,2,0.3),0_4px_18px_0_rgba(3,2,2,0.2)] font-medium
`;

const SectionAside = tw.div`
  w-1/4 bg-gray-300 flex flex-col items-center shadow-lg
`;

const ActionButtonImage = tw.div`
  h-3/5 mb-2 transition-all duration-500 ease-in-out
`;

// const Header = tw.div`
//   flex justify-between items-center transition-all duration-500 ease-in-out
// `;



// const Name = tw.div`
//   mr-2 text-sm transition-all duration-500 ease-in-out
// `;


export default Index;
