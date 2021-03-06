// Copyright ©️ 2016 - Ryan Collins
// admin@ryancollins.io
// http://www.ryancollins.io
// Open sourced under the MIT license
// See LICENSE.md file for details

import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as ProfileActionCreators from './actions';
import cssModules from 'react-css-modules';
import styles from './index.module.scss';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { ToastMessage, LoadingIndicator, UserProfile } from 'components';
import * as AppActions from '../../components/App/actions';
import authUserDataFragment from './authUserDataFragment';
import Box from 'grommet-udacity/components/Box';

class Profile extends Component {
  constructor() {
    super();
    this.handleClearError = this.handleClearError.bind(this);
    this.handleEditingBio = this.handleEditingBio.bind(this);
    this.handleSaving = this.handleSaving.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleCancelEditing = this.handleCancelEditing.bind(this);
    this.handleEditingAvatar = this.handleEditingAvatar.bind(this);
    this.handleEditingEmail = this.handleEditingEmail.bind(this);
    this.handleEditingEmployer = this.handleEditingEmployer.bind(this);
    this.setDefaults = this.setDefaults.bind(this);
  }
  setDefaults() {
    const {
      user,
      actions,
    } = this.props;
    actions.setDefaultInputs({
      bio: user.bio,
      email: user.email,
      avatar: user.avatar,
      employer: user.employer,
    });
  }
  handleClearError() {
    const {
      profileClearError,
    } = this.props.actions;
    profileClearError();
  }
  handleCancelEditing() {
    const {
      profileCancelEditing,
    } = this.props.actions;
    profileCancelEditing();
  }
  handleClick() {
    const {
      profileStartEditing,
    } = this.props.actions;
    this.setDefaults();
    profileStartEditing();
  }
  handleEditingAvatar(e) {
    const {
      profileEditAvatar,
    } = this.props.actions;
    profileEditAvatar(e.target.value);
  }
  handleEditingBio(e) {
    const {
      profileEditBio,
    } = this.props.actions;
    profileEditBio(e.target.value);
  }
  handleEditingEmail(e) {
    const {
      profileEditEmail,
    } = this.props.actions;
    profileEditEmail(e.target.value);
  }
  handleEditingEmployer(e) {
    const {
      profileEditEmployer,
    } = this.props.actions;
    profileEditEmployer(e.target.value);
  }
  handleSaving() {
    const {
      updateProfile,
      bioInput,
      avatarInput,
      employerInput,
      emailInput,
      actions,
      user,
      refetch,
    } = this.props;
    const profile = {
      bio: bioInput,
      avatar: avatarInput,
      employer: employerInput,
      email: emailInput,
    };
    const variables = {
      authToken: user.authToken,
      profile,
    };
    actions.profileSubmissionInitiation();
    updateProfile(variables)
      .then(() => {
        refetch();
        actions.profileSubmissionSuccess();
      })
      .catch(err => {
        actions.profileSubmissionFailure(err.message);
      });
  }
  render() {
    const {
      user,
      loading,
      submissionError,
      bioInput,
      avatarInput,
      isEditing,
      employerInput,
      emailInput,
    } = this.props;
    return (
      <Box>
        {loading &&
          <LoadingIndicator isLoading={loading} />
        }
        {submissionError &&
          <ToastMessage
            status="critical"
            message={submissionError}
            onClose={this.handleClearError}
          />
        }
        {user &&
          <Box className={styles.profile}>
            <UserProfile
              user={user}
              isEditing={isEditing}
              onEditEmail={this.handleEditingEmail}
              onCancel={this.handleCancelEditing}
              onEditBio={this.handleEditingBio}
              onClickToEdit={this.handleClick}
              onSaveEdit={this.handleSaving}
              bioInput={bioInput}
              onEditAvatar={this.handleEditingAvatar}
              avatarInput={avatarInput}
              onEditEmployer={this.handleEditingEmployer}
              employerInput={employerInput}
              emailInput={emailInput}
            />
          </Box>
        }
      </Box>
    );
  }
}

Profile.propTypes = {
  actions: PropTypes.object.isRequired,
  updateProfile: PropTypes.func.isRequired,
  user: PropTypes.object,
  error: PropTypes.string,
  loading: PropTypes.bool.isRequired,
  isEditing: PropTypes.bool.isRequired,
  bioInput: PropTypes.string,
  submissionError: PropTypes.string,
  updateQueries: PropTypes.func.isRequired,
  refetch: PropTypes.func.isRequired,
  avatarInput: PropTypes.string,
  employerInput: PropTypes.string,
  emailInput: PropTypes.string,
};

// mapStateToProps :: {State} -> {Props}
const mapStateToProps = (state) => ({
  user: state.authReducer.user,
  bioInput: state.profileContainer.bioInput,
  submissionError: state.profileContainer.error,
  isEditing: state.profileContainer.isEditing,
  avatarInput: state.profileContainer.avatarInput,
  emailInput: state.profileContainer.emailInput,
  employerInput: state.profileContainer.employerInput,
});

// mapDispatchToProps :: Dispatch -> {Action}
const mapDispatchToProps = (dispatch) => ({
  actions: bindActionCreators(
    Object.assign({},
      AppActions,
      ProfileActionCreators
    ),
    dispatch
  ),
});

const Container = cssModules(Profile, styles);

const fetchUserData = gql`
  query getAuthUser($token:String!) {
    authUser(auth_token: $token) {
      ...authUserData
    }
  }
`;

const ContainerWithData = graphql(fetchUserData, {
  options: (ownProps) => ({
    skip: !ownProps.user.authToken,
    variables: {
      token: ownProps.user.authToken,
    },
    fragments: [authUserDataFragment],
  }),
  props: ({ data: { loading, authUser, error, refetch } }) => ({
    loading,
    error,
    authUser,
    refetch,
  }),
})(Container);

const updateProfileMutation = gql`
  mutation updateProfile($profile: ProfileInput, $authToken: String!) {
    UpdateProfile(input: { profile: $profile, auth_token: $authToken }) {
      user {
        ...authUserData
      }
    }
  }
`;

const ContainerWithMutation = graphql(updateProfileMutation, {
  options: () => ({
    fragments: [authUserDataFragment],
  }),
  props: ({ ownProps, mutate }) => ({
    updateProfile({ authToken, profile }) {
      return new Promise((resolve, reject) =>
        mutate({
          variables: { authToken, profile },
        })
        .then(mutationResult => {
          ownProps.actions.setPersistentUser(mutationResult.data.UpdateProfile.user);
          resolve(mutationResult);
        })
        .catch(err => reject(err))
      );
    },
  }),
})(ContainerWithData);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ContainerWithMutation);
