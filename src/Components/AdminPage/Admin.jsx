import React, { useEffect, useState } from 'react';
import titan_logo from '../../assets/image.png';
import './Admin.css';
import { toast } from 'react-toastify';

const Admin = ({ onLogout }) => {
  const [incidents, setIncidents] = useState([]);
  const [showImg, setShowImg] = useState(false);
  const [imageShown, setImageShown] = useState('');
  const [activeSection, setActiveSection] = useState('');
  const [refresh, setRefresh] = useState(true);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState(''); // New state for search query
  const [pendingIncidentId, setPendingIncidentId] = useState(null);

  const notifyError = (msg) => toast.error(msg);
  const notify = (msg) => toast.info(msg);
  const notifySuccess = (msg) => toast.success(msg);

  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    status: 'active',
    location: '',
    mobile: '',
  });


  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/get-incidents');
        if (!response.ok) {
          throw new Error('Failed to fetch incidents');
        }
        const data = await response.json();
        setIncidents(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching incidents:', error);
      }
    };

    const fetchUsers = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/get-users');
        if (!response.ok) throw new Error('Failed to fetch users');
        const data = await response.json();
        setUsers(Array.isArray(data) ? data : []);
      } catch (error) {
        notifyError('Error fetching users');
        console.error('Error fetching users:', error);
      }
    };

    fetchIncidents();
    fetchUsers();
  }, [refresh]);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    if (!/^\d{7}$/.test(newUser.username)) {
      notifyError('Enter a valid 7-digit dealer code');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/register-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to register user');
      }

      const data = await response.json();
      notify(data.message);

      setNewUser({ username: '', email: '', status: 'active', location: '', mobile: '' });
      setActiveSection('');
    } catch (error) {
      console.error('Error registering user:', error);
      notifyError(error.message || 'An error occurred during user registration.');
    }
  };

  const handleStatusToggle = async (username, currentStatus) => {
    try {
      const response = await fetch('http://localhost:5000/api/update-user-status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, status: currentStatus === 'active' ? 'inactive' : 'active' }),
      });

      if (!response.ok) throw new Error('Failed to update status');
      notifySuccess('Status updated successfully');
      setUsers(
        users.map((user) =>
          user.username === username
            ? { ...user, status: currentStatus === 'active' ? 'inactive' : 'active' }
            : user
        )
      );
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const resetPassword = async (username) => {
    try {
      const response = await fetch('http://localhost:5000/api/admin-reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      if (!response.ok) throw new Error('Failed to reset password');
      const data = await response.json();
      notify(data.message);
    } catch (error) {
      console.error('Error resetting password:', error);
      notifyError('Failed to reset password');
    }
  };

  const deleteIncident = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/delete-incident/${id}`,
         { method: 'DELETE' }
        );
      if (!response.ok) throw new Error('Failed to delete incident');
      setIncidents((prev) => prev.filter((incident) => incident._id !== id));
      notifySuccess('Incident deleted successfully');
    } catch (error) {
      console.error('Error deleting incident:', error);
      notifyError('Failed to delete incident');
    }
  };

  const toggleChecked = async () => {
    if (!pendingIncidentId) return;
  
    try {
      const response = await fetch(`http://localhost:5000/api/update-incident/${pendingIncidentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checked: true }),
      });
      if (!response.ok) throw new Error('Failed to update incident status');
  
      setIncidents((prev) =>
        prev.map((incident) =>
          incident._id === pendingIncidentId ? { ...incident, checked: true } : incident
        )
      );
      setPendingIncidentId(null); // Reset pending incident ID
      notifySuccess('Incident marked as checked');
      setActiveSection(''); // Return to the main screen
    } catch (error) {
      console.error('Error updating incident status:', error);
      notifyError('Failed to update status');
    }
  };
  

  const handleImageClick = (screenshot) => {
    setImageShown(screenshot || '');
    setShowImg(!!screenshot);
  };

  const handleBackClick = () => {
    setActiveSection('');
    setShowImg(false);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <>
      <div className="page-container admin-page">
        <div className="header">
          <img className="titan-logo" src={titan_logo} alt="Titan Logo" />
          <h1>ADMIN</h1>
          <div style={{ zIndex: '10' }}>
            {!activeSection && !showImg && (
              <>
                <button
                  onClick={() => setActiveSection('register')}
                  className="btn-action"
                >
                  Register Dealer
                </button>
                <button
                  onClick={() => setActiveSection('manage')}
                  className="btn-action"
                >
                  Manage Dealer
                </button>
              </>
            )}
            <button
              onClick={() =>{ (activeSection || showImg ? handleBackClick() : onLogout()); setPendingIncidentId(null); }}
              className="btn-logout"
            >
              {activeSection || showImg ? 'Back' : 'Logout'}
            </button>
          </div>
        </div>
        <div className="admin-container">
          {/* new users register */}
          {activeSection === 'register' && (
            <div className="register-form">
              <h2 className="ad-page-title">Register New Dealer</h2>
              
              <form className="login-form" onSubmit={handleRegisterSubmit}>
                  <div className="form-group">
                      <label>Username</label>
                      <input
                          type="text"
                          value={newUser.username}
                          onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                          required
                      />
                  </div>
                  <div className="form-group">
                      <label>Email</label>
                      <input
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                          required
                      />
                  </div>
                  <div className="form-group">
                      <label>Location</label>
                      <input
                          type="text"
                          value={newUser.location}
                          onChange={(e) => setNewUser({ ...newUser, location: e.target.value })}
                          required
                      />
                  </div>
                  <div className="form-group">
                      <label>Mobile Number</label>
                      <input
                          type="text"
                          value={newUser.mobile}
                          onChange={(e) => setNewUser({ ...newUser, mobile: e.target.value })}
                          required
                      />
                  </div>
                  <div className="form-group">
                      <button className="btn-submit" type="submit">
                          Register
                      </button>
                  </div>
              </form>

            </div>
          )}
          {/* manage users section */}
          {activeSection === 'manage' && (
            <div className="user-management">
              <h2 className="ad-page-title">Dealer Management</h2>
              <div className="users-refresh-container">
                <div className='search-container'>
                <label htmlFor="search">Search</label>
                <input 
                  name='search'
                  type="text"
                  className="search-input"
                  placeholder="Search username or email"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                </div>
                <div className='refresh-container'>

                <button
                  className="users-refresh-btn"
                  onClick={() => {
                    if (pendingIncidentId) {
                      toggleChecked(); // Toggle the status of the pending incident
                    } else {
                      setActiveSection(''); // Navigate back if no pending incident
                    }
                  }}
                >
                  Done
                </button>

                <button className="users-refresh-btn" onClick={() => setRefresh(!refresh)}>
                  Refresh
                </button>
                </div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Action</th>
                    <th>Reset password</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers
                    .filter((user) => user.username !== 'admin')
                    .map((user) => (
                      <tr key={user.username}>
                        <td>{user.username}</td>
                        <td>{user.email}</td>
                        <td style={{color: user.status === 'active'?"#4cf52a":"red"}}>{user.status}</td>
                        <td>
                          <button
                            className="btn-toggle-status"
                            onClick={() => handleStatusToggle(user.username, user.status)}
                            style={{width: "90px"}}
                          >
                            {user.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                        <td>
                          <button className="btn-toggle-status" onClick={() => resetPassword(user.username)}>Reset Password</button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
          {/* incidents section */}
          {!activeSection && !showImg && (<>
              <div style={{width: "80vw"}} className="users-refresh-container">
                <h2>Incidents Management</h2>
                <button className="users-refresh-btn" onClick={() => setRefresh(!refresh)}>
                  Refresh
                </button>
              </div>
            <div className="table-container">
              <table style={{width: "90vw"}}>
                <thead>
                  <tr>
                    <th>Dealer Code</th>
                    <th>E-mail</th>
                    <th>Location/City</th>
                    <th>Region</th>
                    <th>Issue</th>
                    <th>Contact No</th>
                    <th>Screenshot</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((incident, index) => (
                    <tr key={index}>
                      <td>{incident.dealerCode}</td>
                      <td>{incident.email}</td>
                      <td>{incident.location}</td>
                      <td>{incident.region}</td>
                      <td>{incident.issue}</td>
                      <td>{incident.contactNo}</td>
                      <td
                        style={{ color: '#66d9ff', cursor: 'pointer' }}
                        onClick={() => handleImageClick(incident.screenshot)}
                      >
                        {incident.screenshot ? 'Click to view Screenshot' : 'No screenshot available'}
                      </td>
                      <td className='actions'>
                        <button style={{backgroundColor: "red"}} onClick={() => deleteIncident(incident._id)}>Delete</button>
                        <button
                          style={{ backgroundColor: incident.checked ? 'green' : '#2a2af5', width: '90px' }}
                          onClick={() => {
                            if (!incident.checked) {
                              setPendingIncidentId(incident._id); // Track the incident to update
                              setActiveSection('manage'); // Navigate to Dealer Management
                            } else {
                              notify('Incident is already checked');
                            }
                          }}
                        >
                          {incident.checked ? 'Checked' : 'Unchecked'}
                        </button>

                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}

          {showImg && (
            <img
              src={imageShown}
              alt="Incident Screenshot"
              style={{ width: 'auto', height: '80vh', position: 'absolute', zIndex: '10' }}
            />
          )}
        </div>
      </div>
      <div className="area">
        <ul className="circles">
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
        </ul>
      </div>
    </>
  );
};

export default Admin;
