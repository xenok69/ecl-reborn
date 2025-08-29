import { useNavigation } from 'react-router'
import { useLoading } from './LoadingContext'
import styles from './LoadingOverlay.module.css'

export default function LoadingOverlay() {
    const navigation = useNavigation()
    const { isLoading: contextLoading } = useLoading()
    
    // Show loading if either router navigation is happening OR context loading is true
    const isLoading = navigation.state === 'loading' || contextLoading

    if (!isLoading) return null

    return (
        <div className={styles.LoadingOverlay}>
            <div className={styles.LoadingBlur} />
            <div className={styles.LoadingContent}>
                <div className={styles.SpinnerContainer}>
                    <div className={styles.Spinner} />
                    <div className={styles.SpinnerRing} />
                </div>
                <div className={styles.LoadingText}>
                    {navigation.state === 'loading' ? 'Loading...' : 'Processing...'}
                </div>
            </div>
        </div>
    )
}