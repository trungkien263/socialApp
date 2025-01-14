import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, StyleSheet, Image, TouchableOpacity} from 'react-native';
import {GlobalStyle} from '../config/globalStyle';
import {Bubble, GiftedChat, InputToolbar, Send} from 'react-native-gifted-chat';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {useSelector} from 'react-redux';
import firestore from '@react-native-firebase/firestore';
import moment from 'moment';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Avatar from '../components/Avatar';

export default function ChatScreen({route, navigation}) {
  const {roomInfo} = route.params;
  const {userDetails} = useSelector(state => state.user);

  console.log('roomInfo in chat', roomInfo);

  const [messages, setMessages] = useState([]);

  //   useEffect(() => {
  //     setMessages([
  //       {
  //         _id: 1,
  //         text: 'Hello developer',
  //         createdAt: new Date(),
  //         user: {
  //           _id: 2,
  //           name: 'React Native',
  //           avatar: 'https://placeimg.com/140/140/any',
  //         },
  //       },
  //     ]);
  //   }, []);

  const fetchMessages = async () => {
    await firestore()
      .collection('rooms')
      .doc(roomInfo.roomId)
      .collection('messages')
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        const msg = snapshot.docs.map(doc => {
          const data = doc.data();
          const id = doc.id;
          const owner =
            data.ownerId === userDetails.uid
              ? userDetails
              : roomInfo.partnerData;
          return {
            _id: id,
            createdAt: data.createdAt.toDate(),
            text: data.text,
            user: {
              _id: data.ownerId,
              name: owner.lname,
              avatar: owner.userImg
                ? owner.userImg
                : 'https://img.favpng.com/25/13/19/samsung-galaxy-a8-a8-user-login-telephone-avatar-png-favpng-dqKEPfX7hPbc6SMVUCteANKwj.jpg',
            },
          };
        });
        setMessages(msg);
      });
  };

  useEffect(() => {
    const data = fetchMessages();
    return data;
  }, []);

  const onSend = useCallback(async (messages = []) => {
    setMessages(previousMessages =>
      GiftedChat.append(previousMessages, messages),
    );
    const data = {
      text: messages[0].text,
      createdAt: firestore.Timestamp.fromDate(new Date()),
      ownerId: userDetails.uid,
    };
    await firestore()
      .collection('rooms')
      .doc(roomInfo.roomId)
      .collection('messages')
      .add(data)
      .then(() => {
        console.log('Send message successfully!');
      })
      .catch(err => {
        console.log('Error while send msg', err);
      });

    await firestore()
      .collection('rooms')
      .doc(roomInfo.roomId)
      .set({
        createdAt: roomInfo.createdAt,
        members: roomInfo.members,
        roomId: roomInfo.roomId,
        lastMsg: {
          message: messages[0].text,
          createdAt: firestore.Timestamp.fromDate(new Date()),
          creator: userDetails.uid,
        },
      })
      .then(() => {
        console.log('Update last message successfully!');
      })
      .catch(err => {
        console.log('Error while update last msg', err);
      });
  }, []);

  const renderSend = props => {
    return (
      <Send {...props}>
        <View>
          <MaterialCommunityIcons
            name="send-circle"
            size={36}
            color={GlobalStyle.colors.COLOR_BLUE}
            style={{
              marginBottom: 4,
              marginRight: 10,
            }}
          />
        </View>
      </Send>
    );
  };

  const renderBubble = props => {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: GlobalStyle.colors.COLOR_BLUE,
          },
          left: {
            backgroundColor: GlobalStyle.colors.COLOR_SILVER,
          },
        }}
        textStyle={{
          right: {
            color: '#fff',
          },
        }}
      />
    );
  };

  const scrollToBottomComponent = () => {
    return (
      <View>
        <FontAwesome name="angle-double-down" size={24} color="#333" />
      </View>
    );
  };

  const renderInputToolbar = props => {
    return (
      <InputToolbar
        {...props}
        style={{color: '#000', backgroundColor: 'red'}}
      />
    );
  };

  return (
    <View style={{flex: 1}}>
      <View
        style={{
          backgroundColor: '#fff',
          height: 48,
          padding: 10,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
        <TouchableOpacity
          onPress={() => {
            navigation.goBack();
          }}>
          <Ionicons
            name="arrow-back"
            size={25}
            color={GlobalStyle.colors.COLOR_BLUE}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            navigation.navigate('Profile', {
              userId: roomInfo?.partnerData?.uid,
            });
          }}
          style={{flexDirection: 'row', alignItems: 'center', marginLeft: 16}}>
          {/* <Image
            source={
              roomInfo?.partnerData?.userImg
                ? {
                    uri: roomInfo?.partnerData?.userImg,
                  }
                : require('../assets/defaultAvatar.png')
            }
            style={{width: 40, height: 40, borderRadius: 100}}
          /> */}
          <Avatar
            user={roomInfo?.partnerData}
            imgStyle={{width: 40, height: 40, borderRadius: 100}}
            tickStyle={{width: 16, height: 16}}
            onPress={() => {
              navigation.navigate('Profile', {
                userId: roomInfo?.partnerData?.uid,
              });
            }}
          />
          <Text style={{fontWeight: '600', marginLeft: 10}}>
            {roomInfo?.partnerData?.name}
          </Text>
        </TouchableOpacity>
      </View>
      <GiftedChat
        messages={messages}
        onSend={messages => onSend(messages)}
        user={{
          _id: userDetails?.uid,
          name: userDetails?.lname,
          avatar: userDetails?.userImg,
        }}
        renderBubble={renderBubble}
        alwaysShowSend={true}
        renderSend={renderSend}
        scrollToBottom
        infiniteScroll={true}
        showAvatarForEveryMessage={false}
        renderInputToolbar={renderInputToolbar}
        textInputProps={{
          color: '#000',
        }}
        placeholder="Nhập tin nhắn..."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});
