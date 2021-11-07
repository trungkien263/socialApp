import React, {useContext, useEffect, useState} from 'react';
import {View, Text, StyleSheet, ScrollView, Alert} from 'react-native';
import FormButton from '../components/FormButton';
import {AuthContext} from '../navigation/AuthProvider';
import Post from '../components/Post';
import {GlobalStyle} from '../config/globalStyle';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import {useIsFocused} from '@react-navigation/native';

export default function HomeScreen() {
  const {user, logout} = useContext(AuthContext);

  const [isLoading, setIsLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [refresh, setRefresh] = useState(false);

  //   const isFocused = useIsFocused();

  const fetchPosts = async () => {
    try {
      const postList = [];

      await firestore()
        .collection('posts')
        .orderBy('createdAt', 'desc')
        .get()
        .then(querySnapshot => {
          //   console.log('Total users: ', querySnapshot.size);

          querySnapshot.forEach(documentSnapshot => {
            const {post, postImg, createdAt, likes, comments, userId} =
              documentSnapshot.data();
            postList.push({
              userName: 'Tzuyu',
              createdAt: createdAt,
              content: post,
              like: likes,
              comment: comments,
              avatar: postImg,
              imageUrl: postImg,
              userId,
              postId: documentSnapshot.id,
            });
          });
        });

      setPosts(postList);
      if (isLoading) {
        setIsLoading(false);
      }
    } catch (error) {
      console.log('error', error);
    }
  };

  const handleDelete = postId => {
    Alert.alert('Delete post', 'Are you sure?', [
      {
        text: 'Cancel',
        onPress: () => console.log('canceled!'),
        style: 'cancel',
      },
      {
        text: 'OK',
        onPress: () => deletePost(postId),
      },
    ]);
  };

  useEffect(() => {
    fetchPosts();
  }, [refresh]);

  // useFocusEffect(()=>{
  //     fetchPosts();
  // })

  const deletePost = postId => {
    console.log('post ID', postId);

    firestore()
      .collection('posts')
      .doc(postId)
      .get()
      .then(documentSnapshot => {
        if (documentSnapshot.exists) {
          const {postImg} = documentSnapshot.data();
          if (postImg !== null) {
            const storageRef = storage().refFromURL(postImg);
            const imageRef = storage().ref(storageRef.fullPath);

            imageRef
              .delete()
              .then(() => {
                console.log(`${postImg} has been deleted successfully!`);
                deleteFirestoreData(postId);
                setRefresh(!refresh);
              })
              .catch(err => {
                console.log('Error while delete the image', err);
              });
            // if the post image is not available
          } else {
            deleteFirestoreData(postId);
            setRefresh(!refresh);
          }
        }
      });
  };

  const deleteFirestoreData = postId => {
    firestore()
      .collection('posts')
      .doc(postId)
      .delete()
      .then(() => {
        Alert.alert(
          'Post deleted!',
          'Your post has been deleted Successfully!',
        );
      })
      .catch(err => {
        console.log('Error while delete the post', err);
      });
  };

  //   const data = [
  //     {
  //       userName: 'Tzuyu',
  //       createdAt: 5,
  //       content: 'Lorem, ipsum dolor sit amet consectetur adipisicing elit.',
  //       like: 69,
  //       comment: 96,
  //       avatar: require('../assets/tzuyu.jpg'),
  //       imageUrl: require('../assets/posts/post-img-1.jpg'),
  //     },
  //     {
  //       userName: 'Taylor Swift',
  //       createdAt: 5,
  //       content: 'Lorem, ipsum dolor sit amet consectetur adipisicing elit.',
  //       like: 69,
  //       comment: 96,
  //       avatar: require('../assets/tzuyu.jpg'),
  //       imageUrl: require('../assets/posts/post-img-2.jpg'),
  //     },
  //     {
  //       userName: 'Maria Ozawa',
  //       createdAt: 5,
  //       content: 'Lorem, ipsum dolor sit amet consectetur adipisicing elit.',
  //       like: 69,
  //       comment: 96,
  //       avatar: require('../assets/tzuyu.jpg'),
  //       imageUrl: require('../assets/posts/post-img-3.jpg'),
  //     },
  //   ];

  return (
    <ScrollView style={styles.container}>
      {posts.map((item, index) => {
        {
          /* console.log('passing item', item) */
        }
        return <Post key={index} item={item} onDeletePost={handleDelete} />;
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    paddingHorizontal: 16,
    backgroundColor: GlobalStyle.colors.COLOR_BACKGROUND,
  },
});