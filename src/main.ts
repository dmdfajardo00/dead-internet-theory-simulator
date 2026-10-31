import { mount } from 'svelte'
import { addCollection } from '@iconify/svelte'
import icons from './lib/icons.json'
import App from './App.svelte'
import './app.css'

addCollection(icons)

export default mount(App, { target: document.getElementById('app')! })
