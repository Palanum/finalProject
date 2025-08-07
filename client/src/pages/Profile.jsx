import React from 'react'
import './Profile.css'

const Profile = () => {
  return (
    <div className='profile-container'>
        <section id='profile' className='profile-section'>
            <h1>Profile shown here</h1>
        </section>
        <section id='favorite' className='favorite-section'>
            <h1>favorite shown here</h1>
        </section>
        <section id='myRecipe' className='myRecipe-section'>
            <h1>myRecipe shown here</h1>
        </section>
        <section id='alarm' className='alarm-section'>
            <h1>alarm shown here</h1>
        </section>
    </div>
  )
}

export default Profile