import React, { useRef, useState, useCallback } from 'react';
import titan_logo from '../../assets/image.png';
import { toast, } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";


const HelpPage = ({ onSubmit, back, setIncorrect }) => {
  const inputFile = useRef(null);
  const [otherIssue, setOtherIssue] = useState("");
  const [formData, setFormData] = useState({
    dealerCode: '',
    location: '',
    region: '',
    email: '', 
    issue: '',
    contactNo: '',
    screenshot: null,
  });

  const regions = ['NORTH', 'SOUTH 1', 'SOUTH 2', 'WEST', 'EAST'];
  const issues = ['Not able to Login', 'Request to change Password', 'New Collection is not Available', 'Other issue'];

  

  const notify = (msg) => toast.error(msg);
  

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, screenshot: reader.result })); // Save base64 image
      };
      reader.readAsDataURL(file); // Convert file to Base64
    }
  };

  const handleSubmit =  () => {
    setIncorrect(false);
    if (!formData.dealerCode || !formData.location || !formData.region || !formData.issue || !formData.contactNo) {
      notify("Fill all the required fields");
      return;
    }
    if (!/^\d{7}$/.test(formData.dealerCode)) {
      notify('Enter a valid 7-digit dealer code');
      return;
    }
    if (!formData.screenshot) {
      notify("Kindly provide a screenshot of the issue.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(formData.contactNo)) {
      notify('Enter a valid Contact number');
      return;
    }
    if (formData.issue === "Other issue" && otherIssue) {
      formData.issue = otherIssue;
    }

    console.log("Submitting formData in HelpPage:", formData);

    
    onSubmit(formData);

    // Reset form after submission
    setOtherIssue("");
    setFormData({
      dealerCode: '',
      location: '',
      region: '',
      issue: '',
      email: '',
      contactNo: '',
      screenshot: null,
    });
  };

  return (
    <>
      <div className="page-container help-page">
        <img className='titan-logo' src={titan_logo} alt="Titan Logo" />
        
        <div className="help-container">
        
          <div className="header">
            <h1>INCIDENT MANAGEMENT</h1>
          </div>
          <div className="help-form">
           
            <div className="form-group helpform-label">
              <label htmlFor="dealerCode">DEALER CODE</label>
              <input
                id="dealerCode"
                value={formData.dealerCode}
                onChange={(e) => setFormData((prev) => ({ ...prev, dealerCode: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">E-MAIL</label>
              <input
                id="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label htmlFor="location">LOCATION/CITY</label>
              <input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label htmlFor="region">REGION</label>
              <select
                id="region"
                value={formData.region}
                onChange={(e) => setFormData((prev) => ({ ...prev, region: e.target.value }))}
              >
                <option value="">Select Region</option>
                {regions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="issue">ISSUE</label>
              <select
                id="issue"
                value={formData.issue}
                onChange={(e) => {
                  const issue = e.target.value;
                  setFormData((prev) => ({ ...prev, issue }));
                  if (issue !== 'Other issue') {
                    setOtherIssue('');
                  }
                }}
              >
                <option value="">Select Issue</option>
                {issues.map((issue) => (
                  <option key={issue} value={issue}>
                    {issue}
                  </option>
                ))}
              </select>
            </div>
            {formData.issue === 'Other issue' && (
              <div className="form-group">
                <label htmlFor="otherIssue">DESCRIBE ISSUE</label>
                <input
                  id="otherIssue"
                  value={otherIssue}
                  onChange={(e) => setOtherIssue(e.target.value)}
                />
              </div>
            )}
            <div className="form-group">
              <label htmlFor="contactNo">CONTACT NO</label>
              <input
                id="contactNo"
                value={formData.contactNo}
                onChange={(e) => setFormData((prev) => ({ ...prev, contactNo: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>SCREENSHOT</label>
              <div className="browse-file">
                <input
                  type="file"
                  ref={inputFile}
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <span>{formData.screenshot ? 'Screenshot uploaded' : 'No file chosen'}</span>
                <button
                  className="btn-browse"
                  onClick={() => inputFile.current.click()}
                >
                  Browse
                </button>
              </div>
              
            </div>
            <div className="button-group">
              <button onClick={handleSubmit} className="btn-submit">
                SUBMIT
              </button>
              <button onClick={back} className="btn-submit">
                BACK
              </button>
            </div>
          </div>
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

export default HelpPage;
