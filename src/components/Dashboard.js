/**
 * Dashboard Component
 * Main dashboard integrating all app features
 */

import React, { useState, useEffect } from 'react';
import { useProfile } from '../features/profile/hooks/useProfile.js';
import { useChat } from '../features/chat/hooks/useChat.js';
import { useBluetooth } from '../features/bluetooth/hooks/useBluetooth.js';
import { useAgeVerification } from '../features/ageVerification/hooks/useAgeVerification.js';
import { ProfileView, ProfileSetup } from '../features/profile/index.js';
import ProfileEdit from '../features/profile/components/ProfileEdit.js';
import { ChatList } from '../features/chat/index.js';
import { BluetoothProximity } from '../features/bluetooth/index.js';
import { AgeVerificationSetup, AgeVerificationStatus } from '../features/ageVerification/index.js';
import './Dashboard.css';

const Dashboard = () => {
  const [activeSection, setActiveSection] = useState('profile');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  
  // Profile hooks
  const {
    profile,
    settings,
    stats,
    loading: profileLoading,
    error: profileError,
    refreshProfile,
    createProfile
  } = useProfile();

  // Chat hooks
  const {
    conversations,
    activeConversation,
    loading: chatLoading,
    error: chatError,
    selectConversation
  } = useChat(profile?.id);

  // Bluetooth hooks
  const {
    isSupported: bluetoothSupported,
    isScanning,
    nearbyDevices,
    error: bluetoothError,
    status: bluetoothStatus,
    startScanning,
    stopScanning,
    clearDevices,
    deviceCount,
    hasDevices,
    canScan
  } = useBluetooth();

  // Age Verification hooks
  const {
    status: ageVerificationStatus,
    verificationResult,
    isAvailable: ageVerificationAvailable,
    error: ageVerificationError,
    verificationHistory
  } = useAgeVerification();

  // Set selected conversation when active conversation changes
  useEffect(() => {
    if (activeConversation) {
      setSelectedConversation(activeConversation.id);
    }
  }, [activeConversation]);

  const handleSectionChange = (section) => {
    setActiveSection(section);
    if (section !== 'chat') {
      setSelectedConversation(null);
    }
  };

  const handleProfileEdit = () => {
    setShowProfileEdit(true);
  };

  const handleProfileSave = async () => {
    console.log('Profile save completed, refreshing data...');
    setShowProfileEdit(false);
    setShowProfileSetup(false);
    // Refresh profile data
    if (refreshProfile) {
      await refreshProfile();
      console.log('Profile data refreshed');
    }
  };

  const handleCreateProfile = () => {
    setShowProfileSetup(true);
  };

  const handleConversationSelect = (conversationId) => {
    setSelectedConversation(conversationId);
    selectConversation(conversationId);
  };


  if (profileLoading) {
    return (
      <div className="dashboard">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="dashboard">
        <div className="dashboard-error">
          <h2>Error Loading Dashboard</h2>
          <p>{profileError}</p>
          <button onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="dashboard-title">
          <h1>Physical</h1>
          <p>Nothing Between</p>
        </div>
        <div className="dashboard-user-info">
          {profile && (
            <div className="user-avatar">
              {profile.profilePicture ? (
                <img 
                  src={profile.profilePicture} 
                  alt={profile.displayName}
                  className="avatar-image"
                />
              ) : (
                <div className="avatar-placeholder">
                  {profile.displayName?.charAt(0)?.toUpperCase()}
                </div>
              )}
              <span className="user-name">{profile.displayName}</span>
            </div>
          )}
        </div>
      </header>

      {/* Navigation */}
      <nav className="dashboard-nav">
        <button 
          className={`nav-item ${activeSection === 'profile' ? 'active' : ''}`}
          onClick={() => handleSectionChange('profile')}
        >
          <span className="nav-icon">👤</span>
          <span className="nav-label">Profile</span>
        </button>
        <button 
          className={`nav-item ${activeSection === 'discover' ? 'active' : ''}`}
          onClick={() => handleSectionChange('discover')}
        >
          <span className="nav-icon">🔍</span>
          <span className="nav-label">Discover</span>
          {deviceCount > 0 && (
            <span className="nav-badge">{deviceCount}</span>
          )}
        </button>
        <button 
          className={`nav-item ${activeSection === 'age-verification' ? 'active' : ''}`}
          onClick={() => handleSectionChange('age-verification')}
        >
          <span className="nav-icon">🆔</span>
          <span className="nav-label">Age Verification</span>
          {ageVerificationStatus === 'verified' && (
            <span className="nav-badge verified">✓</span>
          )}
        </button>
        <button 
          className={`nav-item ${activeSection === 'chat' ? 'active' : ''}`}
          onClick={() => handleSectionChange('chat')}
        >
          <span className="nav-icon">💬</span>
          <span className="nav-label">Chat</span>
          {conversations && conversations.length > 0 && (
            <span className="nav-badge">{conversations.length}</span>
          )}
        </button>
        <button 
          className={`nav-item ${activeSection === 'matches' ? 'active' : ''}`}
          onClick={() => handleSectionChange('matches')}
        >
          <span className="nav-icon">❤️</span>
          <span className="nav-label">Matches</span>
        </button>
      </nav>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Profile Section */}
        {activeSection === 'profile' && (
          <div className="dashboard-section profile-section">
            <div className="section-header">
              <h2>My Profile</h2>
              <button 
                className="btn-primary"
                onClick={handleProfileEdit}
              >
                Edit Profile
              </button>
            </div>
            
            {showProfileSetup ? (
              <ProfileSetup 
                createProfile={createProfile}
                onComplete={handleProfileSave}
                onCancel={() => setShowProfileSetup(false)}
              />
            ) : showProfileEdit ? (
              <ProfileEdit 
                onSave={handleProfileSave}
                onCancel={() => setShowProfileEdit(false)}
              />
            ) : (
              <div className="profile-content">
                <ProfileView 
                  onEdit={handleProfileEdit}
                  onCreateProfile={handleCreateProfile}
                />
                
                {/* Profile Stats */}
                {stats && (
                  <div className="profile-stats">
                    <h3>Your Stats</h3>
                    <div className="stats-grid">
                      <div className="stat-item">
                        <span className="stat-number">{stats.totalViews || 0}</span>
                        <span className="stat-label">Profile Views</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-number">{stats.totalMatches || 0}</span>
                        <span className="stat-label">Matches</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-number">{stats.activeConversations || 0}</span>
                        <span className="stat-label">Active Chats</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Settings Summary */}
                {settings && (
                  <div className="settings-summary">
                    <h3>Discovery Settings</h3>
                    <div className="settings-info">
                      <p>
                        <strong>Looking for:</strong> {settings.discovery?.lookingFor || 'Not specified'}
                      </p>
                      <p>
                        <strong>Discovery enabled:</strong> {settings.discovery?.enabled ? 'Yes' : 'No'}
                      </p>
                      <p>
                        <strong>Max distance:</strong> {settings.discovery?.maxDistance || 'Not set'}m
                      </p>
                      <p>
                        <strong>Privacy level:</strong> {settings.privacy?.level || 'Not set'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Discover Section */}
        {activeSection === 'discover' && (
          <div className="dashboard-section discover-section">
            <div className="section-header">
              <h2>Discover People Nearby</h2>
            </div>
            
            <div className="discovery-content">
              <BluetoothProximity />
            </div>
          </div>
        )}


        {/* Age Verification Section */}
        {activeSection === 'age-verification' && (
          <div className="dashboard-section age-verification-section">
            <div className="section-header">
              <h2>Age Verification</h2>
              <div className="verification-status">
                <span className={`status-indicator ${ageVerificationStatus}`}>
                  {ageVerificationStatus === 'verified' ? 'Verified ✓' :
                   ageVerificationStatus === 'pending' ? 'Pending...' :
                   ageVerificationStatus === 'failed' ? 'Failed' : 'Not Verified'}
                </span>
              </div>
            </div>
            
            <div className="age-verification-content">
              <div className="verification-setup">
                <h3>Setup Age Verification</h3>
                <AgeVerificationSetup />
              </div>
              
              <div className="verification-status-display">
                <h3>Verification Status</h3>
                <AgeVerificationStatus />
              </div>
            </div>
          </div>
        )}

        {/* Chat Section */}
        {activeSection === 'chat' && (
          <div className="dashboard-section chat-section">
            <div className="chat-container">
              <div className="chat-sidebar">
                <div className="section-header">
                  <h3>Conversations</h3>
                </div>
                <ChatList 
                  conversations={conversations}
                  onSelectConversation={handleConversationSelect}
                  loading={chatLoading}
                  error={chatError}
                />
              </div>
              
              <div className="chat-main">
                {selectedConversation ? (
                  <div className="chat-placeholder">
                    <div className="placeholder-icon">💬</div>
                    <h3>Chat Window</h3>
                    <p>Chat functionality will be displayed here</p>
                  </div>
                ) : (
                  <div className="chat-placeholder">
                    <div className="placeholder-icon">💬</div>
                    <h3>Select a conversation</h3>
                    <p>Choose a conversation from the sidebar to start chatting</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Matches Section */}
        {activeSection === 'matches' && (
          <div className="dashboard-section matches-section">
            <div className="section-header">
              <h2>Your Matches</h2>
            </div>
            
            <div className="matches-content">
              <div className="matches-placeholder">
                <div className="placeholder-icon">❤️</div>
                <h3>Matches Feature</h3>
                <p>View and manage your matches</p>
                <p className="placeholder-note">
                  This feature will show users who have matched with you
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="dashboard-footer">
        <p>&copy; 2024 Physical App. Connect with people around you.</p>
      </footer>
    </div>
  );
};

export default Dashboard;
