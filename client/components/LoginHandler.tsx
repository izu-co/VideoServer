import React from "react";
import { Dimensions, Image, StyleSheet, Text, View } from "react-native";
import { TextInput, TouchableOpacity } from "react-native-gesture-handler";
import { MonoText } from "./StyledText";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";
import normalize from "../constants/FontSize";
import { FontAwesome } from "@expo/vector-icons";
import Axios from "axios";
import axios from "axios";

export type TToken = {
  token: string
}

export type TInputData = {
  username?: string,
  password?: string,
  websiteBase?: string
}

export type TModalState = {
  text?: {
    title: string,
    body: string
  },
  visable: boolean,
  timer?: NodeJS.Timeout
}

const loginContext = React.createContext<undefined|TToken>(undefined);

const LoginHandler: React.FC = () => {

  const [modalState, _setModalState] = React.useState<TModalState>({ visable: false });
  const setModalState = (state: TModalState) => {
    if (modalState.timer) 
      clearTimeout(modalState.timer)
    if (!state.timer && state.visable) {
      state.timer = setTimeout(() => {
        _setModalState({
          visable: false
        })
      }, 5000);
    }
    _setModalState(state);
  }


  const [inputData, setInputData] = React.useState<TInputData>({
    ...(global["window"] ? {
      websiteBase: global["window"].location.origin
    } : {})
  })

  const handleChange = (text: string, type: keyof TInputData) => {
    console.log(text);
    setInputData({
      ...inputData,
      [type]: text
    })
  }

  const login = async () => {
    if (Object.keys(inputData).length !== 3 || inputData.password?.length === 0 || inputData.username?.length === 0 || inputData.websiteBase?.length === 0 ) {
      setModalState({
        visable: true,
        text: {
          title: 'More info',
          body: 'Please enter all three fields!'
        }
      })
    }
  }

  console.log(inputData);

  return (
    <View style={LoginStyles.view}>
      {modalState.visable && <View style={[LoginStyles.modal]}>
        <MonoText>{modalState.text.title}</MonoText>
      </View>}
      <View style={LoginStyles.container}>
        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: "center", alignItems: 'center', paddingBottom: 25 }}>
          {Dimensions.get('window').width > 960 
            && <Image style={LoginStyles.image} source={require('../assets/images/icon.png')} resizeMethod="scale" resizeMode="contain" />
          }
          <MonoText style={LoginStyles.h1} adjustsFontSizeToFit >Login</MonoText>
        </View>
        <View style={[LoginStyles.textWithImage, LoginStyles.loginComponent, LoginStyles.inputContainer]}>
          <FontAwesome color="white" size={20} style={{ margin: 5 }} name="search" />
          <TextInput style={[LoginStyles.input, LoginStyles.loginComponent]} value={inputData.websiteBase} placeholderTextColor="#949494"
            placeholder={"Website URL"} onChangeText={(text) => handleChange(text, "websiteBase")}
            />
        </View>
        <View style={[LoginStyles.textWithImage, LoginStyles.loginComponent, LoginStyles.inputContainer]}>
          <FontAwesome color="white" size={20} style={{ margin: 5 }} name="user" />
          <TextInput style={[LoginStyles.input, LoginStyles.loginComponent]} value={inputData.username} placeholderTextColor="#949494"
            placeholder={"Username"} onChangeText={(text) => handleChange(text, "username")}
            />
        </View>
        <View style={[LoginStyles.textWithImage, LoginStyles.loginComponent, LoginStyles.inputContainer]}>
          <FontAwesome color="white" size={20} style={{ margin: 5 }} name="lock" />
          <TextInput style={[LoginStyles.input, LoginStyles.loginComponent]} value={inputData.password} placeholderTextColor="#949494" secureTextEntry
            placeholder={"Password"} onChangeText={(text) => handleChange(text, "password")} />
        </View>
        <TouchableOpacity onPress={login}>
          <Text style={[LoginStyles.loginButton, LoginStyles.loginComponent]}>Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const LoginStyles = StyleSheet.create({
  modal: {
    position: 'absolute',
    right: 10,
    top: 10,
    width: '60%',
    height: '30%',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    maxWidth: 400,
    maxHeight: 200,
    display: 'flex'
  },
  modalHeader: {

  },
  view: {
    backgroundColor: '#262626',
    height: '100%',
    width: '100%'
  },
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '80%',
    height: '100%',
    left: '10%'
  },
  input: {
    justifyContent: "center",
    fontFamily: 'Barlow_600SemiBold',
    fontSize: normalize(20)
  },
  inputContainer: {
    borderBottomColor: 'white',
    borderBottomWidth: 1,
    marginBottom: 20
  },
  textWithImage: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative'
  },
  image: {
    width: "100%",
    height: hp(20),
    padding: 0,
    margin: 0,
    marginRight: 10
  },
  h1: {
    fontSize: normalize(50)
  },
  loginButton: {
    backgroundColor: '#404040',
    fontSize: normalize(17),
    borderColor: 'white',
    borderWidth: 1,
    padding: 10,
    marginTop: 20
  },
  loginComponent: {
    width: "100%",
    color: 'white',
    maxWidth: 400,
  }
})

export default LoginHandler;
export { loginContext }