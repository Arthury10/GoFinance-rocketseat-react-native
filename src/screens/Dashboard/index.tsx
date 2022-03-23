import React, {useCallback, useEffect, useState} from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {ActivityIndicator, TouchableOpacity} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {useTheme} from 'styled-components'
import { useAuth } from '../../hooks/auth'
import { HightLightCard } from '../../components/HightLightCard'
import { TransactionCard, TransactionCardProps } from '../../components/TransactionCard'
import { 
  Container,
  Header,
  UserWrapper,
  UserInfo,
  Photo,
  User,
  UserGreeting,
  UserName,
  Icon,
  HightLightCards,
  Transactions,
  Title,
  TransactionList,
  LoadContainer
} from './styles'


export interface DataListProps extends TransactionCardProps{
  id: string
}

interface highLightProps {
  amount: string;
  lastTransaction: string;
}

interface HighLightData{
  entries: highLightProps,
  expensives: highLightProps,
  total: highLightProps

}

export const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [transactions, setTransactions] = useState<DataListProps[]>([])
  const [highLightData, setHighLightData] = useState<HighLightData>({} as HighLightData)

  const theme = useTheme()
  const {signOut, user} = useAuth()

  function getLastTransactionDate(
    collection: DataListProps[],
    type: 'positive' | 'negative'
    ){

    const collectionFiltered = collection.filter(item => item.type === type) 

    if(collectionFiltered.length === 0){
      return 0
    }

    const lastTransaction = new Date (
      Math.max.apply(Math, collectionFiltered
      .map((transaction) => new Date(transaction.date).getTime()))
    )
      return `${lastTransaction.getDate()} de ${lastTransaction.toLocaleString('pt-BR', {month: 'long'})}`;
  }

  async function loadTransactions(){
    const dataKey = `@gofinances:transactions_user:${user.id}`
    const response = await AsyncStorage.getItem(dataKey)
    // await AsyncStorage.removeItem(dataKey)
    // console.log(response)

    let entriesTotal = 0;
    let expensiveTotal = 0;

        
    const transactions = response ? JSON.parse(response) : []
    // console.log(transactions)
    
    
    const transactionFormatted: DataListProps[] = transactions
    .map((item: DataListProps) => {

      if(item.type === 'positive'){
        entriesTotal += Number(item.amount)
      } else {
        expensiveTotal += Number(item.amount)
      }

      const amount = Number(item.amount).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      })
      
      const date = Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      }).format(new Date(item.date))
      
      return {
        id: item.id,
        name: item.name,
        amount,
        type: item.type,
        category: item.category,
        date
      }
      
    })


    setTransactions(transactionFormatted)
    const lastTransactionsEntries = getLastTransactionDate(transactions, 'positive')
    const lastTransactionsExpensives = getLastTransactionDate(transactions, 'negative')
    
    const totalInterval = lastTransactionsExpensives === 0 ? 
    'Não há transações' : `01 a ${lastTransactionsExpensives}`
    
    const total = entriesTotal - expensiveTotal
    setHighLightData({
      entries: {
        amount: entriesTotal.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }),
        lastTransaction: lastTransactionsEntries === 0 ? 
        '' : `Última entrada dia ${lastTransactionsEntries}`,
      },
      expensives: {
        amount: expensiveTotal.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }),
        lastTransaction: lastTransactionsExpensives === 0 ? '' : `Última saída dia ${lastTransactionsExpensives}`,
      },
      total: {
        amount: total.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }),
        lastTransaction: totalInterval
      }
    })
    setIsLoading(false)
  }

  useEffect(() => {
    loadTransactions()
    // const dataKey = '@gofinances:transactions'
    // AsyncStorage.remove(dataKey)
  }, [])

  useFocusEffect(useCallback(() => {
    loadTransactions()
  },[]))

    return (
      <Container>
        { isLoading ? 
        <LoadContainer>
          <ActivityIndicator 
          color={theme.colors.primary} 
          size="large"
          />
        </LoadContainer> 
          : 
          <>
          <Header>
            <UserWrapper>
            <UserInfo>
              <Photo source={{uri: user.photo}}/>
              <User>
                <UserGreeting>Olá</UserGreeting>
                <UserName>{user.name}</UserName>
              </User>
            </UserInfo>
            <TouchableOpacity onPress={signOut}>
              <Icon name="power"/>
            </TouchableOpacity>
            </UserWrapper>
          </Header>
          <HightLightCards>
            <HightLightCard 
            type="up"
            title='Entradas' 
            amount={highLightData.entries.amount} 
            lastTransaction={highLightData.entries.lastTransaction}
            />
            <HightLightCard 
            type="down"
            title='Saídas' 
            amount={highLightData.expensives.amount} 
            lastTransaction={highLightData.expensives.lastTransaction}
            />
            <HightLightCard 
            type="total"
            title='Total'
            amount={highLightData.total.amount} 
            lastTransaction={highLightData.total.lastTransaction}
            />
          </HightLightCards>
          <Transactions>
            <Title>Listagem</Title>
            <TransactionList 
            data={transactions}
            keyExtractor={item => item.id}
            renderItem={({item}) => <TransactionCard data={item}/>}
            />
          </Transactions>
          </>
        }
        </Container>
    )
  }